'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredTenantId, setStoredTenantId } from '@/lib/tenant';
import { tenantsApi, projectsApi, ProjectSummary } from '@/lib/api';

export default function HomePage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantNameInput, setTenantNameInput] = useState('');
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [tenantError, setTenantError] = useState('');

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    setTenantId(getStoredTenantId());
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    setLoadingProjects(true);
    projectsApi
      .list(tenantId)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [tenantId]);

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    const name = tenantNameInput.trim();
    if (!name) {
      setTenantError('Enter a workspace name to continue');
      return;
    }
    setCreatingTenant(true);
    setTenantError('');
    try {
      const tenant = await tenantsApi.create(name);
      setStoredTenantId(tenant.id);
      setTenantId(tenant.id);
    } catch (err: any) {
      setTenantError(err.message || 'Could not create workspace');
    } finally {
      setCreatingTenant(false);
    }
  }

  // ---------- Onboarding: no default tenant exists, ever ----------
  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-24">
        <h1 className="font-serif text-3xl mb-2">Welcome to Sandbox.ai</h1>
        <p className="text-ink-2 mb-6">Name your workspace to get started. This is required — there is no default workspace.</p>
        <form onSubmit={handleCreateTenant} className="flex flex-col gap-3">
          <input
            value={tenantNameInput}
            onChange={(e) => setTenantNameInput(e.target.value)}
            placeholder="e.g. acme-corp"
            className="border border-border rounded-lg px-4 py-3 bg-white"
            autoFocus
          />
          {tenantError && <p className="text-red text-sm">{tenantError}</p>}
          <button
            type="submit"
            disabled={creatingTenant}
            className="bg-ink text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
          >
            {creatingTenant ? 'Creating…' : 'Create Workspace'}
          </button>
        </form>
      </div>
    );
  }

  // ---------- Hero ----------
  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-br from-[#161616] to-[#1e1e1e] text-white p-12 mb-8">
        <div className="text-teal text-xs font-bold uppercase tracking-wide mb-3">● Welcome back</div>
        <h1 className="font-serif text-5xl mb-4">
          Model it before <em className="italic">you build it.</em>
        </h1>
        <p className="text-white/70 max-w-xl mb-6">
          Describe an app in plain language or connect an existing repo — Sandbox.ai models your
          environment, surfaces risks, generates code, and keeps everything in sync with your Git provider.
        </p>
        <div className="flex gap-3">
          <Link href="/generate" className="bg-gradient-to-r from-teal to-teal-2 text-[#0a1a18] font-semibold px-6 py-3 rounded-xl">
            Generate Environment
          </Link>
          <Link href="/connect" className="bg-white/10 border border-white/15 text-white font-semibold px-6 py-3 rounded-xl">
            Connect a Repo
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl">Your Projects</h2>
        <Link href="/generate" className="text-sm font-semibold text-teal-2">+ Generate New</Link>
      </div>

      {loadingProjects ? (
        <p className="text-ink-3">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-ink-3">
          No projects yet. Generate one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="border border-border rounded-xl p-5 bg-white hover:shadow-md transition-shadow"
            >
              <div className="font-semibold mb-1">{p.name}</div>
              <p className="text-sm text-ink-3 line-clamp-2">{p.description}</p>
              <div className="text-xs text-ink-3 mt-3">{p.status}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
