import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';
import { mockFetch } from '../test/mockFetch';
import { loadSession, saveSession } from './session';
import { emptyInventory, userSession } from '../test/fixtures';

describe('Protected route', () => {
  it('redirects to the login page when logged out', () => {
    renderApp('/');

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /dashboard/i })).not.toBeInTheDocument();
  });

  it('shows the dashboard and the signed-in email when a session exists', async () => {
    mockFetch(emptyInventory);
    saveSession(userSession);
    renderApp('/');

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(userSession.user.email)).toBeInTheDocument();
    await screen.findByText(/no vehicles/i);
  });

  it('logging out clears the session and returns to the login page', async () => {
    mockFetch(emptyInventory);
    saveSession(userSession);
    renderApp('/');
    await screen.findByText(/no vehicles/i);

    await userEvent.setup().click(screen.getByRole('button', { name: /log out/i }));

    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });
});
