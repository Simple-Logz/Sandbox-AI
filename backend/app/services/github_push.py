"""
GitHub push logic, server-side. Handles:
- Empty repos (uses the Contents API, which initialises the Git DB)
- Existing repos (uses the Git Data API — one commit for all files)
- Branch resolution with retries for repos still being initialised by GitHub
"""
import base64
import re
import time
from typing import Optional

import httpx

GITHUB_API = "https://api.github.com"


class GitPushError(Exception):
    pass


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _parse_repo_url(repo_url: str) -> tuple[str, str]:
    clean = repo_url.rstrip("/").removesuffix(".git")
    match = re.search(r"github\.com[/:]([^/\s]+)/([^/\s]+)", clean)
    if not match:
        raise GitPushError("Invalid GitHub URL — expected https://github.com/owner/repo")
    return match.group(1), match.group(2)


def push_to_github(repo_url: str, token: str, files: dict[str, str], folder: str,
                    branch: Optional[str] = None) -> dict:
    owner, repo = _parse_repo_url(repo_url)
    api = f"{GITHUB_API}/repos/{owner}/{repo}"
    headers = _headers(token)

    with httpx.Client(timeout=30) as client:
        repo_res = client.get(api, headers=headers)
        if repo_res.status_code == 401:
            raise GitPushError('Token rejected — check it is valid and has "repo" scope')
        if repo_res.status_code == 403:
            raise GitPushError("Access denied — token may be expired or missing scope")
        if repo_res.status_code == 404:
            raise GitPushError(f'Repo "{owner}/{repo}" not found')
        repo_res.raise_for_status()
        repo_data = repo_res.json()

        perms = repo_data.get("permissions", {})
        if not (perms.get("push") or perms.get("admin") or perms.get("maintain")):
            raise GitPushError(f'No write access to "{owner}/{repo}"')

        resolved_branch = branch or repo_data.get("default_branch") or "main"
        is_empty = repo_data.get("size", 0) == 0

        clean_folder = re.sub(r"[^a-zA-Z0-9._-]", "-", folder)

        if is_empty:
            return _push_to_empty_repo(client, api, headers, files, clean_folder, resolved_branch, owner, repo)
        return _push_to_existing_repo(client, api, headers, files, clean_folder, resolved_branch, owner, repo)


def _push_to_empty_repo(client, api, headers, files, folder, branch, owner, repo) -> dict:
    """Empty repos can't use the Git Data API yet — use Contents API, which
    initialises the Git DB as a side effect of the first write."""
    pushed = 0
    for path, content in files.items():
        full_path = f"{folder}/{path}"
        body = {
            "message": f"feat: scaffold {folder} via Sandbox.ai" if pushed == 0 else f"feat: add {path}",
            "content": base64.b64encode(content.encode()).decode(),
            "branch": branch,
        }
        res = client.put(f"{api}/contents/{full_path}", headers=headers, json=body)
        if res.status_code == 409 and pushed == 0:
            time.sleep(3)
            res = client.put(f"{api}/contents/{full_path}", headers=headers, json=body)
        if res.status_code not in (200, 201):
            raise GitPushError(f"Failed pushing {path}: {res.status_code} {res.text[:200]}")
        pushed += 1

    return {"owner": owner, "repo": repo, "branch": branch, "files_pushed": pushed}


def _push_to_existing_repo(client, api, headers, files, folder, branch, owner, repo) -> dict:
    """Existing repos use the efficient Git Data API — one commit for everything."""
    base_sha = None
    base_tree_sha = None

    for attempt in range(4):
        ref_res = client.get(f"{api}/git/ref/heads/{branch}", headers=headers)
        if ref_res.status_code == 200:
            base_sha = ref_res.json()["object"]["sha"]
            commit_res = client.get(f"{api}/git/commits/{base_sha}", headers=headers)
            base_tree_sha = commit_res.json()["tree"]["sha"]
            break
        if ref_res.status_code == 404:
            break  # no commits on this branch yet
        if ref_res.status_code == 409:
            time.sleep(2 + attempt)
            continue
        raise GitPushError(f"Cannot access branch {branch}: {ref_res.status_code}")

    tree_items = []
    for path, content in files.items():
        blob_res = client.post(f"{api}/git/blobs", headers=headers, json={
            "content": base64.b64encode(content.encode()).decode(),
            "encoding": "base64",
        })
        if blob_res.status_code != 201:
            raise GitPushError(f"Failed uploading {path}: {blob_res.status_code}")
        tree_items.append({
            "path": f"{folder}/{path}", "mode": "100644", "type": "blob",
            "sha": blob_res.json()["sha"],
        })

    tree_body = {"tree": tree_items}
    if base_tree_sha:
        tree_body["base_tree"] = base_tree_sha
    tree_res = client.post(f"{api}/git/trees", headers=headers, json=tree_body)
    if tree_res.status_code != 201:
        raise GitPushError(f"Failed creating tree: {tree_res.status_code}")
    new_tree_sha = tree_res.json()["sha"]

    commit_body = {
        "message": f"feat: scaffold {folder} via Sandbox.ai ({len(tree_items)} files)",
        "tree": new_tree_sha,
    }
    if base_sha:
        commit_body["parents"] = [base_sha]
    commit_res = client.post(f"{api}/git/commits", headers=headers, json=commit_body)
    if commit_res.status_code != 201:
        raise GitPushError(f"Failed creating commit: {commit_res.status_code}")
    new_commit_sha = commit_res.json()["sha"]

    if base_sha:
        update_res = client.patch(f"{api}/git/refs/heads/{branch}", headers=headers,
                                   json={"sha": new_commit_sha, "force": False})
        if update_res.status_code != 200:
            raise GitPushError(f"Failed updating branch: {update_res.status_code}")
    else:
        create_res = client.post(f"{api}/git/refs", headers=headers,
                                  json={"ref": f"refs/heads/{branch}", "sha": new_commit_sha})
        if create_res.status_code != 201:
            raise GitPushError(f"Failed creating branch: {create_res.status_code}")

    return {"owner": owner, "repo": repo, "branch": branch, "files_pushed": len(tree_items)}
