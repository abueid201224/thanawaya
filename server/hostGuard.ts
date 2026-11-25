/**
 * Host / Origin validation for the loopback-only server. A socket address check alone does not stop
 * DNS rebinding: a page on evil.com can resolve to 127.0.0.1 and the browser then connects from
 * loopback while sending `Host: evil.com`. Pure functions so they can be unit tested.
 */

/** Self-contained (no relative imports) so it compiles under both tsconfig files. */
export function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '::1' || /^127(?:\.\d{1,3}){3}$/.test(h);
}

function hostnameOf(hostWithPort: string): string | null {
  const h = hostWithPort.trim();
  if (h === '') return null;
  if (h.startsWith('[')) {
    const m = /^(\[[0-9a-fA-F:]+\])(?::(\d{1,5}))?$/.exec(h);
    return m ? m[1] : null;
  }
  const m = /^([^:/@\s]+)(?::(\d{1,5}))?$/.exec(h);
  return m ? m[1] : null;
}

export function isAllowedHostHeader(host: string | undefined): boolean {
  if (typeof host !== 'string') return false;
  const name = hostnameOf(host);
  return name !== null && isLoopbackHost(name);
}

/** A missing Origin (same-origin navigation, curl, Electron) is allowed; a present one must be loopback http(s). */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (origin === undefined) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return isLoopbackHost(u.hostname);
  } catch {
    return false;
  }
}
