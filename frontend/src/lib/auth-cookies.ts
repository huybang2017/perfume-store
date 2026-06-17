const TOKEN_KEY = 'accessToken';
const ROLE_KEY = 'userRole';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookies(token: string, role: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
  document.cookie = `${ROLE_KEY}=${role}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${ROLE_KEY}=; path=/; max-age=0`;
}

export const AUTH_COOKIE = { TOKEN_KEY, ROLE_KEY };
