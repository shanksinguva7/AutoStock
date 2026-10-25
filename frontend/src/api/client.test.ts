import { describe, expect, it } from 'vitest';
import { ApiError, apiRequest } from './client';
import { saveSession } from '../auth/session';
import { mockFetch } from '../test/mockFetch';
import { userSession } from '../test/fixtures';

describe('apiRequest', () => {
  it('sends a JSON body and returns the parsed response', async () => {
    const fetchMock = mockFetch({ status: 200, body: { ok: true } });

    const result = await apiRequest('/api/things', { method: 'POST', body: { name: 'x' } });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/things');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'x' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('attaches the stored token as a bearer header', async () => {
    saveSession(userSession);
    const fetchMock = mockFetch({ status: 200, body: [] });

    await apiRequest('/api/vehicles');

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  });

  it('sends no authorization header when logged out', async () => {
    const fetchMock = mockFetch({ status: 200, body: [] });

    await apiRequest('/api/vehicles');

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('throws an ApiError carrying the status and the server error message', async () => {
    mockFetch({ status: 409, body: { error: 'Email is already registered' } });

    const failure = apiRequest('/api/auth/register', { method: 'POST', body: {} });

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 409, message: 'Email is already registered' });
  });

  it('returns undefined for a 204 with no body', async () => {
    mockFetch({ status: 204 });

    await expect(apiRequest('/api/vehicles/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
