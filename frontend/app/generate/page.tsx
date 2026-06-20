'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredTenantId } from '@/lib/tenant';
import { generateApi, projectsApi } from '@/lib/api';

const STACK_OPTIONS = ['FastAPI', 'Next.js', 'Node', 'Django', 'Go', 'Postgres', 'MongoDB', 'Redis', 'Docker', 'Terraform'];

export default function GeneratePage() {
  const router = useRouter();
  const [name, setName] = useState('');          // intentionally blank — no default project name, ever
  const [intent, setIntent] = useState('');
  const [stack, setStack] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  function toggleStack(s: string) {
    setStack((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleGenerate() {
    const tenantId = getStoredTenantId();
    if (!tenantId) {
      router.push('/');
      return;
    }
    if (!intent.trim()) {
      setError('Please describe what you want to build');
      return;
    }
    // Required project name — generation is blocked until the user types one.
    // This mirrors the backend's own validation (422 on empty name), so the
    // failure is caught instantly client-side too.
    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      setTimeout(() => setNameError(false), 600);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await generateApi.run(tenantId, name.trim(), intent.trim(), stack);
      const project = await projectsApi.create({
        tenant_id: tenantId,
        name: name.trim(),
        intent: intent.trim(),
        description: result.description,
        architecture: result.architecture,
        files: result.files,
      });
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl mb-1">Generate Environment</h1>
      <p className="text-ink-3 mb-6">Describe what you want to build — the more specific, the better the result.</p>

      <label className="block text-sm font-semibold mb-1.5">Project Name</label>
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. orders-service"
        required
        className={`w-full border rounded-lg px-3.5 py-2.5 mb-1 bg-white ${
          nameError ? 'input-error-shake border-red' : 'border-border'
        }`}
      />
      <p className="text-xs text-ink-3 mb-4">Required — there's no default name, you choose it.</p>

      <label className="block text-sm font-semibold mb-1.5">Your intent</label>
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={8}
        placeholder="e.g. A backend API with a Postgres database for tracking customer orders…"
        className="w-full border border-border rounded-lg px-3.5 py-3 mb-4 bg-white resize-none"
      />

      <label className="block text-sm font-semibold mb-2">Stack (optional)</label>
      <div className="flex flex-wrap gap-2 mb-6">
        {STACK_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleStack(s)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              stack.includes(s) ? 'bg-ink text-white border-ink' : 'border-border text-ink-2'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-ink text-white font-semibold rounded-lg py-3.5 disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Environment'}
      </button>
    </div>
  );
}
