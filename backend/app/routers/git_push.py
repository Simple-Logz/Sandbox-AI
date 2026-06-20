from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.github_push import push_to_github, GitPushError

router = APIRouter(prefix="/projects", tags=["Git Push"])


@router.post("/{project_id}/push")
def push_project(project_id: str, payload: schemas.GitPushRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    if not project.files:
        raise HTTPException(400, "No files to push — generate the project first")

    if payload.provider != "github":
        raise HTTPException(400, f"{payload.provider} push not yet supported — download the ZIP and push manually")

    try:
        result = push_to_github(
            repo_url=payload.repo_url,
            token=payload.token,
            files=project.files,
            folder=project.name,
            branch=payload.branch,
        )
    except GitPushError as exc:
        raise HTTPException(400, str(exc))

    # Record the successful push on the project row — same row, no duplication
    project.repo_provider = "github"
    project.repo_url = payload.repo_url
    project.repo_branch = result["branch"]
    project.repo_owner = result["owner"]
    project.repo_name = result["repo"]
    project.status = models.ProjectStatus.PUSHED
    db.commit()

    return result
