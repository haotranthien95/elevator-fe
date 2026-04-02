export const ADMIN_SESSION_COOKIE = "yecl-admin-session";
export const PREVIEW_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "ops@yomaelevator.com";
export const PREVIEW_ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "preview-access";
export const DEFAULT_ADMIN_REDIRECT = "/admin";

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function hasValidAdminSession(value?: string) {
  if (!value?.trim()) {
    return false;
  }

  const payload = decodeJwtPayload(value);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now();
}

export function normalizeAdminRedirect(value?: string | null) {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  if (value.startsWith("/admin/login")) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  return value;
}
