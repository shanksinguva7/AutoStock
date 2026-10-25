import { loadSession } from '../auth/session';

const NO_CONTENT = 204;
const NETWORK_ERROR_STATUS = 0;
const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.';

/** A failed API call, carrying the HTTP status and the backend's `{ error }` message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

/**
 * The only place the app calls fetch. Sends JSON, attaches the stored JWT,
 * and turns non-2xx responses into ApiError so callers can show the message.
 */
export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = loadSession()?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, NETWORK_ERROR_MESSAGE);
  }

  if (response.status === NO_CONTENT) {
    return undefined as T;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? `Request failed with status ${response.status}`);
  }
  return data as T;
}
