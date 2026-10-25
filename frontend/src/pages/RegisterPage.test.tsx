import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';
import { mockFetch, mockPendingFetch } from '../test/mockFetch';
import { emptyInventory, regularUser } from '../test/fixtures';
import { loadSession } from '../auth/session';

async function submitRegister(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(/email/i), email);
  if (password) await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /create account/i }));
}

describe('Register page', () => {
  it('shows an error on a 409 duplicate email', async () => {
    mockFetch({ status: 409, body: { error: 'Email is already registered' } });
    renderApp('/register');

    await submitRegister('driver@example.com', 'long-enough-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
  });

  it('shows the server validation message on a 400', async () => {
    mockFetch({ status: 400, body: { error: 'Invalid email address' } });
    renderApp('/register');

    await submitRegister('driver@example.com', 'long-enough-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email address');
  });

  it('shows a validation error for a password shorter than 8 characters', async () => {
    const fetchMock = mockFetch();
    renderApp('/register');

    await submitRegister('driver@example.com', 'short');

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows validation errors for an empty form', async () => {
    const fetchMock = mockFetch();
    renderApp('/register');

    await submitRegister('', '');

    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signs the new user in and opens the dashboard after registering', async () => {
    const fetchMock = mockFetch(
      { status: 201, body: regularUser },
      { status: 200, body: { token: 'jwt-new', user: regularUser } },
      emptyInventory,
    );
    renderApp('/register');

    await submitRegister('driver@example.com', 'long-enough-password');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    const authCalls = fetchMock.mock.calls.map(([url]) => url).slice(0, 2);
    expect(authCalls).toEqual(['/api/auth/register', '/api/auth/login']);
    expect(loadSession()?.token).toBe('jwt-new');
  });

  it('disables the button and shows a loading label while submitting', async () => {
    mockPendingFetch();
    renderApp('/register');

    await submitRegister('driver@example.com', 'long-enough-password');

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });
});
