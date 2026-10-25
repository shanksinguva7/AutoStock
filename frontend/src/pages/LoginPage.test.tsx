import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';
import { mockFetch, mockPendingFetch } from '../test/mockFetch';
import { emptyInventory, regularUser } from '../test/fixtures';
import { loadSession } from '../auth/session';

async function submitLogin(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(/email/i), email);
  if (password) await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /log in/i }));
}

describe('Login page', () => {
  it('shows the server error on a 401', async () => {
    mockFetch({ status: 401, body: { error: 'Invalid email or password' } });
    renderApp('/login');

    await submitLogin('driver@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(loadSession()).toBeNull();
  });

  it('successful login stores the session and navigates to the dashboard', async () => {
    const fetchMock = mockFetch({ status: 200, body: { token: 'jwt-123', user: regularUser } }, emptyInventory);
    renderApp('/login');

    await submitLogin('driver@example.com', 'correct-password');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(loadSession()).toEqual({ token: 'jwt-123', user: regularUser });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(JSON.parse(init.body)).toEqual({ email: 'driver@example.com', password: 'correct-password' });
  });

  it('shows a validation error and does not call the server when email is empty', async () => {
    const fetchMock = mockFetch();
    renderApp('/login');

    await submitLogin('', 'some-password');

    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a validation error for an invalid email', async () => {
    const fetchMock = mockFetch();
    renderApp('/login');

    await submitLogin('not-an-email', 'some-password');

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a validation error when password is empty', async () => {
    const fetchMock = mockFetch();
    renderApp('/login');

    await submitLogin('driver@example.com', '');

    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('disables the button and shows a loading label while submitting', async () => {
    mockPendingFetch();
    renderApp('/login');

    await submitLogin('driver@example.com', 'correct-password');

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });

  it('links to the register page', () => {
    renderApp('/login');

    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/register');
  });
});
