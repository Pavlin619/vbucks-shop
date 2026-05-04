import 'server-only';

/**
 * Read a required env var, throwing `Missing required environment
 * variable: NAME` if absent. Replaces `process.env.X!` so misconfig
 * surfaces with a clear name instead of an opaque downstream failure.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
