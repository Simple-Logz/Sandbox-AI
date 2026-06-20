/**
 * Tracks which tenant the current browser session is working as.
 *
 * Unlike the old app (which had `const TENANT_NAME = "demo-tenant"`
 * hardcoded globally), there is no default tenant anywhere here. The first
 * time someone uses the app, they must create or select a tenant — see
 * app/page.tsx's onboarding check.
 */

const STORAGE_KEY = 'sandbox_tenant_id';

export function getStoredTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredTenantId(id: string) {
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function clearStoredTenantId() {
  window.localStorage.removeItem(STORAGE_KEY);
}
