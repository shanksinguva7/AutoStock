import { vi } from 'vitest';

export interface MockResponse {
  status: number;
  body?: unknown;
}

/** Replaces global fetch with a mock that answers each call with the next response in order. */
export function mockFetch(...responses: MockResponse[]) {
  const fetchMock = vi.fn();
  for (const { status, body } of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** A fetch that never settles, for asserting on the in-flight state. */
export function mockPendingFetch() {
  const fetchMock = vi.fn(() => new Promise(() => {}));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
