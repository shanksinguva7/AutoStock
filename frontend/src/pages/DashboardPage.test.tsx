import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';
import { mockFetch, type MockResponse } from '../test/mockFetch';
import { saveSession } from '../auth/session';
import { civic, corolla, userSession } from '../test/fixtures';

function renderDashboard(...responses: MockResponse[]) {
  const fetchMock = mockFetch(...responses);
  saveSession(userSession);
  renderApp('/');
  return fetchMock;
}

function vehicleCard(name: string) {
  return within(screen.getByRole('article', { name }));
}

function requestedUrls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.map(([url]) => url);
}

describe('Vehicle dashboard', () => {
  it('shows loading, then the vehicles', async () => {
    renderDashboard({ status: 200, body: [corolla, civic] });

    expect(screen.getByText(/loading vehicles/i)).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: 'Toyota Corolla' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Honda Civic' })).toBeInTheDocument();
    expect(screen.queryByText(/loading vehicles/i)).not.toBeInTheDocument();
    expect(vehicleCard('Toyota Corolla').getByText('Sedan')).toBeInTheDocument();
    expect(vehicleCard('Toyota Corolla').getByText('$22,000')).toBeInTheDocument();
    expect(vehicleCard('Toyota Corolla').getByText('2 in stock')).toBeInTheDocument();
  });

  it('shows an empty state when none match', async () => {
    renderDashboard({ status: 200, body: [corolla] }, { status: 200, body: [] });
    const user = userEvent.setup();
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    await user.type(screen.getByLabelText('Make'), 'Ferrari');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText(/no vehicles match your filters/i)).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    renderDashboard({ status: 500, body: { error: 'Internal server error' } });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not load vehicles/i);
    expect(alert).toHaveTextContent('Internal server error');
  });

  it('retries the request from the error state', async () => {
    renderDashboard({ status: 500, body: { error: 'Internal server error' } }, { status: 200, body: [corolla] });

    await userEvent.setup().click(await screen.findByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('article', { name: 'Toyota Corolla' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Purchase is disabled and labelled out of stock at quantity 0', async () => {
    renderDashboard({ status: 200, body: [corolla, civic] });
    await screen.findByRole('article', { name: 'Honda Civic' });

    expect(vehicleCard('Honda Civic').getByRole('button', { name: /out of stock/i })).toBeDisabled();
    expect(vehicleCard('Toyota Corolla').getByRole('button', { name: 'Purchase' })).toBeEnabled();
  });

  it('clicking Purchase calls the API and refreshes the list', async () => {
    const fetchMock = renderDashboard(
      { status: 200, body: [corolla] },
      { status: 200, body: { ...corolla, quantity: 1 } },
      { status: 200, body: [{ ...corolla, quantity: 1 }] },
    );
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    await userEvent.setup().click(vehicleCard('Toyota Corolla').getByRole('button', { name: 'Purchase' }));

    expect(await vehicleCard('Toyota Corolla').findByText('1 in stock')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Purchased Toyota Corolla');
    expect(requestedUrls(fetchMock)).toEqual(['/api/vehicles', '/api/vehicles/1/purchase', '/api/vehicles']);
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('a 409 shows an error toast and refreshes the list', async () => {
    renderDashboard(
      { status: 200, body: [corolla] },
      { status: 409, body: { error: 'Vehicle is out of stock' } },
      { status: 200, body: [{ ...corolla, quantity: 0 }] },
    );
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    await userEvent.setup().click(vehicleCard('Toyota Corolla').getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle is out of stock');
    expect(await vehicleCard('Toyota Corolla').findByRole('button', { name: /out of stock/i })).toBeDisabled();
  });

  it('search sends only the filled filters', async () => {
    const fetchMock = renderDashboard({ status: 200, body: [corolla, civic] }, { status: 200, body: [corolla] });
    const user = userEvent.setup();
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    await user.type(screen.getByLabelText('Make'), 'toyota');
    await user.type(screen.getByLabelText('Max price'), '30000');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('article', { name: 'Toyota Corolla' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Honda Civic' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('/api/vehicles/search?make=toyota&maxPrice=30000');
  });

  it('clearing the filters shows all vehicles', async () => {
    const fetchMock = renderDashboard(
      { status: 200, body: [corolla, civic] },
      { status: 200, body: [corolla] },
      { status: 200, body: [corolla, civic] },
    );
    const user = userEvent.setup();
    await screen.findByRole('article', { name: 'Honda Civic' });
    await user.type(screen.getByLabelText('Make'), 'toyota');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('Toyota Corolla');

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(await screen.findByRole('article', { name: 'Honda Civic' })).toBeInTheDocument();
    expect(screen.getByLabelText('Make')).toHaveValue('');
    expect(requestedUrls(fetchMock)[2]).toBe('/api/vehicles');
  });

  it('refreshes with the active filters after a purchase', async () => {
    const fetchMock = renderDashboard(
      { status: 200, body: [corolla, civic] },
      { status: 200, body: [corolla] },
      { status: 200, body: { ...corolla, quantity: 1 } },
      { status: 200, body: [{ ...corolla, quantity: 1 }] },
    );
    const user = userEvent.setup();
    await screen.findByRole('article', { name: 'Honda Civic' });
    await user.type(screen.getByLabelText('Category'), 'sedan');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('Toyota Corolla');

    await user.click(vehicleCard('Toyota Corolla').getByRole('button', { name: 'Purchase' }));

    expect(await vehicleCard('Toyota Corolla').findByText('1 in stock')).toBeInTheDocument();
    expect(requestedUrls(fetchMock)[3]).toBe('/api/vehicles/search?category=sedan');
  });
});
