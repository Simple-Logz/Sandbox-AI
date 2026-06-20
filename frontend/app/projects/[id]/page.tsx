'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectsApi, Project } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Git push form state
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [token, setToken] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushResult, setPushResult] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.get(id).then((p) => {
      setProject(p);
      setRepoUrl(p.repo_url || '');
      setBranch(p.repo_branch || '');
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleRename(newName: string) {
    if (!project || !newName.trim()) return;
    // PUT to the SAME project id — this is an update, never a new row.
    const updated = await projectsApi.update(project.id, { name: newName.trim() });
    setProject(updated);
  }

  async function handleResave() {
    if (!project) return;
    setSaveStatus('saving');
    // Re-saving an already-saved project is always an UPDATE to its
    // existing id. There is no code path in this app that can create a
    // second row for the same project — the old "duplicate on save" bug
    // is impossible here because creation only ever happens once, at
    // /generate, and every subsequent save goes through this PUT call.
    await projectsApi.update(project.id, {
      description: project.description ?? undefined,
      files: project.files,
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  }

  async function handlePush() {
    if (!project) return;
    if (!repoUrl.trim() || !token.trim()) {
      setPushError('Repository URL and access token are required');
      return;
    }
    setPushing(true);
    setPushError('');
    setPushResult(null);
    try {
      const result = await projectsApi.push(project.id, 'github', repoUrl.trim(), token.trim(), branch.trim() || undefined);
      setPushResult(`Pushed ${result.files_pushed} files to ${result.owner}/${result.repo} → ${result.branch}`);
      const refreshed = await projectsApi.get(project.id);
      setProject(refreshed);
    } catch (err: any) {
      setPushError(err.message || 'Push failed');
    } finally {
      setPushing(false);
    }
  }

  if (loading) return <p className="text-ink-3">Loading…</p>;
  if (!project) return <p className="text-red">Project not found</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <input
            defaultValue={project.name}
            onBlur={(e) => handleRename(e.target.value)}
            className="font-serif text-3xl bg-transparent border-none focus:outline-none focus:underline"
          />
          <p className="text-ink-3 mt-1">{project.description}</p>
        </div>
        <button
          onClick={handleResave}
          className="border border-border rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '💾 Save'}
        </button>
      </div>

      {project.repo_url && (
        <div className="mb-6 p-3.5 rounded-xl bg-teal/5 border border-teal/40 flex items-center justify-between">
          <span className="text-sm font-semibold">
            Connected to {project.repo_owner}/{project.repo_name} ({project.repo_branch})
          </span>
          <a href={project.repo_url} target="_blank" className="text-sm text-teal-2 font-semibold">
            View on GitHub →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {project.architecture.map((a, i) => (
          <div key={i} className="border border-border rounded-xl p-4 bg-white">
            <div className="text-xs font-bold uppercase text-ink-3 mb-1">{a.layer}</div>
            <div className="font-serif text-lg mb-1">{a.tech}</div>
            <div className="text-sm text-ink-2">{a.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-xl mb-3">Files ({Object.keys(project.files).length})</h2>
      <div className="border border-border rounded-xl bg-white mb-8 max-h-64 overflow-y-auto">
        {Object.keys(project.files).map((f) => (
          <div key={f} className="px-4 py-2 text-sm font-mono border-b border-border last:border-0">{f}</div>
        ))}
      </div>

      <h2 className="font-serif text-xl mb-3">Push to GitHub</h2>
      <div className="border border-border rounded-xl p-5 bg-white flex flex-col gap-3 max-w-lg">
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/you/my-project"
          className="border border-border rounded-lg px-3.5 py-2.5"
        />
        <input
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="main (leave blank for default branch)"
          className="border border-border rounded-lg px-3.5 py-2.5"
        />
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Personal Access Token"
          className="border border-border rounded-lg px-3.5 py-2.5"
        />
        {pushError && <p className="text-red text-sm">{pushError}</p>}
        {pushResult && <p className="text-green text-sm">{pushResult}</p>}
        <button
          onClick={handlePush}
          disabled={pushing}
          className="bg-ink text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
        >
          {pushing ? 'Pushing…' : 'Push to Repository'}
        </button>
      </div>
    </div>
  );
}
