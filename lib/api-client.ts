import 'client-only';

export interface ApiErrorBody {
  error?: string;
  [key: string]: unknown;
}

/**
 * Thrown by `apiFetch` for non-2xx responses. Carries the HTTP status and the
 * parsed body so callers can branch on status (`409` → insufficient balance,
 * `404` → shop rotated, etc.) and surface backend `error` strings without
 * re-parsing the response.
 */
export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(typeof body.error === 'string' ? body.error : `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions extends RequestInit {
  /**
   * Where to send the user when the API responds 401. Defaults to the current
   * pathname so sign-in resumes the same flow.
   */
  signInRedirectTo?: string;
}

/**
 * Thin wrapper around `fetch` that:
 *  - safe-parses JSON (a non-JSON 500 won't blow up the catch block)
 *  - throws `ApiError(status, body)` for non-2xx
 *  - redirects to `/sign-in?redirect_url=<path>` on 401 instead of throwing,
 *    matching the pattern `use-checkout` / `use-place-order` already follow.
 *
 * Returns the parsed body for 2xx responses.
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { signInRedirectTo, ...init } = options;
  const res = await fetch(input, init);

  if (res.status === 401) {
    const redirect = signInRedirectTo ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (typeof window !== 'undefined') {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(redirect)}`;
    }
    // Never resolves on the client — the navigation replaces the page.
    return new Promise<T>(() => {});
  }

  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}
