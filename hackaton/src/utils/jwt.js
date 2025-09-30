// Utility to decode JWT and check expiry
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false; // If no exp, treat as not expired
    // exp is in seconds since epoch
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; // If decode fails, treat as expired
  }
}
