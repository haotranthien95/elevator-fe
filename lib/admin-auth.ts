export const ADMIN_SESSION_COOKIE = "yecl-admin-session";
export const ADMIN_SESSION_VALUE = "preview-authenticated";
export const PREVIEW_ADMIN_EMAIL = "ops@yomaelevator.com";
export const PREVIEW_ADMIN_PASSWORD = "preview-access";
export const DEFAULT_ADMIN_REDIRECT = "/admin";

export function hasValidAdminSession(value?: string) {
  return value === ADMIN_SESSION_VALUE;
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
