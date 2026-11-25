import { isLoopbackHost } from './hostGuard.ts';

/**
 * Decides which network interface the standalone Express server binds to.
 * Pure (no side effects) so it can be unit tested.
 *
 * Default is loopback only. Exposing the server to the network must be an explicit
 * choice via the HOST environment variable.
 */
export const DEFAULT_LISTEN_HOST = '127.0.0.1';

export interface ListenHost {
  host: string;
  isLoopback: boolean;
}

export { isLoopbackHost };

export function resolveListenHost(env: { HOST?: string | undefined }): ListenHost {
  const requested = (env.HOST ?? '').trim();
  const host = requested === '' ? DEFAULT_LISTEN_HOST : requested;
  return { host, isLoopback: isLoopbackHost(host) };
}

/** Binding to a non-loopback interface is refused unless the operator opts in explicitly. */
export function isNetworkBindAllowed(env: { ALLOW_NETWORK_BIND?: string | undefined }): boolean {
  return (env.ALLOW_NETWORK_BIND ?? '').trim() === '1';
}
