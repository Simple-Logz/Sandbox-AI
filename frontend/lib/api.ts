/**
 * Single typed API client. Every backend call goes through here — no more
 * scattered global apiGet/apiPost functions with no type safety.
 *
 * The Anthropic API key is NEVER referenced here or anywhere in the
 * frontend — generation happens server-side via /generate.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || `Request failed (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Types ----------
export interface Tenant {
  id: string;
  name: string;
  plan: string;
  credit_balance: number;
  created_at: string;
}

export interface ArchitectureLayer {
  layer: string;
  tech: string;
  desc: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  intent: string;
  description: string | null;
  architecture: ArchitectureLayer[];
  files: Record<string, string>;
  status: 'draft' | 'generating' | 'ready' | 'pushed' | 'archived';
  repo_provider: string | null;
  repo_url: string | null;
  repo_branch: string | null;
  repo_owner: string | null;
  repo_name: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: Project['status'];
  repo_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GenerateResult {
  description: string;
  architecture: ArchitectureLayer[];
  files: Record<string, string>;
  source: 'ai' | 'fallback';
}

export interface DeployEvent {
  id: string;
  project_id: string;
  environment: string;
  version: string | null;
  deployed_by: string | null;
  url: string | null;
  simulated: boolean;
  received_at: string;
}

export interface GitPushResult {
  owner: string;
  repo: string;
  branch: string;
  files_pushed: number;
}

// ---------- Tenants ----------
export const tenantsApi = {
  create: (name: string) => request<Tenant>('/tenants/', { method: 'POST', body: JSON.stringify({ name }) }),
  get: (id: string) => request<Tenant>(`/tenants/${id}`),
};

// ---------- Generation ----------
export const generateApi = {
  /**
   * Generates a project. `name` is required — the backend rejects an
   * empty name with a 422 before any AI call. There is no fallback to a
   * placeholder name anywhere in this stack.
   */
  run: (tenantId: string, name: string, intent: string, stack: string[] = []) =>
    request<GenerateResult>('/generate/', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, name, intent, stack }),
    }),
};

// ---------- Projects ----------
export const projectsApi = {
  list: (tenantId: string) => request<ProjectSummary[]>(`/projects/?tenant_id=${tenantId}`),
  get: (id: string) => request<Project>(`/projects/${id}`),

  /** Creates exactly one new row. Call this ONCE per project, on first save. */
  create: (data: {
    tenant_id: string;
    name: string;
    intent: string;
    description?: string;
    architecture?: ArchitectureLayer[];
    files?: Record<string, string>;
  }) => request<Project>('/projects/', { method: 'POST', body: JSON.stringify(data) }),

  /**
   * Updates the existing row by id. Always use this for re-saves —
   * never call `create` again for a project that already has an id.
   * This is what makes duplicate saves structurally impossible.
   */
  update: (id: string, data: Partial<Pick<Project,
    'name' | 'description' | 'architecture' | 'files' | 'status' |
    'repo_provider' | 'repo_url' | 'repo_branch' | 'repo_owner' | 'repo_name'
  >>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string, actor?: string) =>
    request<void>(`/projects/${id}${actor ? `?actor=${encodeURIComponent(actor)}` : ''}`, { method: 'DELETE' }),

  rename: (id: string, name: string) =>
    request<Project>(`/projects/${id}/rename?name=${encodeURIComponent(name)}`, { method: 'POST' }),

  push: (id: string, provider: string, repoUrl: string, token: string, branch?: string) =>
    request<GitPushResult>(`/projects/${id}/push`, {
      method: 'POST',
      body: JSON.stringify({ provider, repo_url: repoUrl, token, branch }),
    }),
};

// ---------- Deployments ----------
export const deploymentsApi = {
  list: (projectId: string) => request<DeployEvent[]>(`/projects/${projectId}/deployments/`),
  signal: (projectId: string, data: {
    environment?: string; version?: string; deployed_by?: string; url?: string; simulated?: boolean;
  }) => request<DeployEvent>(`/projects/${projectId}/deployments/`, { method: 'POST', body: JSON.stringify(data) }),
};
