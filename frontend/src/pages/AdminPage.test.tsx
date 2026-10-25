import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';
import { mockFetch, type MockResponse } from '../test/mockFetch';
import { saveSession, type Session } from '../auth/session';
import { adminSession, civic, corolla, userSession } from '../test/fixtures';

function renderAs(session: Session, path: string, ...responses: MockResponse[]) {
  const fetchMock = mockFetch(...responses);
  saveSession(session);
  renderApp(path);
  return fetchMock;
}

function vehicleRow(name: string) {
  return within(screen.getByRole('article', { name }));
}

function requests(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`);
}

async function fillVehicleForm(fields: Record<string, string>) {
  const user = userEvent.setup();
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  }
  return user;
}

describe('Admin access', () => {
  it('admin sees the admin link and panel', async () => {
    renderAs(adminSession, '/', { status: 200, body: [corolla] }, { status: 200, body: [corolla] });
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    await userEvent.setup().click(screen.getByRole('link', { name: 'Admin' }));

    expect(await screen.findByRole('heading', { name: /manage inventory/i })).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: 'Toyota Corolla' })).toBeInTheDocument();
  });

  it('a normal user does not see the admin link and is redirected from /admin', async () => {
    renderAs(userSession, '/admin', { status: 200, body: [corolla] });

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /manage inventory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    await screen.findByRole('article', { name: 'Toyota Corolla' });
  });
});

describe('Admin panel', () => {
  it('a successful add refreshes the list', async () => {
    const newCivic = { ...civic, id: 3 };
    const fetchMock = renderAs(
      adminSession,
      '/admin',
      { status: 200, body: [corolla] },
      { status: 201, body: newCivic },
      { status: 200, body: [corolla, newCivic] },
    );
    await screen.findByRole('article', { name: 'Toyota Corolla' });

    const user = await fillVehicleForm({
      Make: 'Honda',
      Model: 'Civic',
      Category: 'Sedan',
      Price: '24000',
      Quantity: '0',
    });
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByRole('article', { name: 'Honda Civic' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added Honda Civic');
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles', 'POST /api/vehicles', 'GET /api/vehicles']);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      make: 'Honda',
      model: 'Civic',
      category: 'Sedan',
      price: 24000,
      quantity: 0,
    });
    expect(screen.getByLabelText('Make')).toHaveValue('');
  });

  it('the add form shows validation errors for a negative price', async () => {
    const fetchMock = renderAs(adminSession, '/admin', { status: 200, body: [] });
    await screen.findByText(/no vehicles/i);

    const user = await fillVehicleForm({ Make: 'Honda', Model: 'Civic', Category: 'Sedan', Price: '-1', Quantity: '1' });
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByText(/price must be a number of 0 or more/i)).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles']);
  });

  it('the add form shows validation errors for a decimal quantity', async () => {
    const fetchMock = renderAs(adminSession, '/admin', { status: 200, body: [] });
    await screen.findByText(/no vehicles/i);

    const user = await fillVehicleForm({ Make: 'Honda', Model: 'Civic', Category: 'Sedan', Price: '100', Quantity: '1.5' });
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByText(/quantity must be a whole number of 0 or more/i)).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles']);
  });

  it('the add form requires make, model and category', async () => {
    const fetchMock = renderAs(adminSession, '/admin', { status: 200, body: [] });
    await screen.findByText(/no vehicles/i);

    const user = await fillVehicleForm({ Price: '100', Quantity: '1' });
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByText(/enter a make/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a model/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a category/i)).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles']);
  });

  it('shows the server error when an add fails', async () => {
    renderAs(adminSession, '/admin', { status: 200, body: [] }, { status: 403, body: { error: 'Admin access required' } });
    await screen.findByText(/no vehicles/i);

    const user = await fillVehicleForm({ Make: 'Honda', Model: 'Civic', Category: 'Sedan', Price: '100', Quantity: '1' });
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Admin access required');
  });

  it('editing a vehicle sends the full update and refreshes the list', async () => {
    const fetchMock = renderAs(
      adminSession,
      '/admin',
      { status: 200, body: [corolla] },
      { status: 200, body: { ...corolla, price: 21000 } },
      { status: 200, body: [{ ...corolla, price: 21000 }] },
    );
    await screen.findByRole('article', { name: 'Toyota Corolla' });
    const user = userEvent.setup();

    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Make')).toHaveValue('Toyota');
    await fillVehicleForm({ Price: '21000' });
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await vehicleRow('Toyota Corolla').findByText('$21,000')).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles', 'PUT /api/vehicles/1', 'GET /api/vehicles']);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      make: 'Toyota',
      model: 'Corolla',
      category: 'Sedan',
      price: 21000,
      quantity: 2,
    });
    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument();
  });

  it('cancelling an edit returns to an empty add form', async () => {
    renderAs(adminSession, '/admin', { status: 200, body: [corolla] });
    await screen.findByRole('article', { name: 'Toyota Corolla' });
    const user = userEvent.setup();

    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Cancel edit' }));

    expect(screen.getByLabelText('Make')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument();
  });

  it('delete asks for confirmation and does nothing if cancelled', async () => {
    const fetchMock = renderAs(adminSession, '/admin', { status: 200, body: [corolla] });
    await screen.findByRole('article', { name: 'Toyota Corolla' });
    const user = userEvent.setup();

    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Delete' }));
    expect(vehicleRow('Toyota Corolla').getByText(/delete toyota corolla\?/i)).toBeInTheDocument();
    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Cancel' }));

    expect(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles']);
  });

  it('confirming delete removes the vehicle and refreshes the list', async () => {
    const fetchMock = renderAs(
      adminSession,
      '/admin',
      { status: 200, body: [corolla, civic] },
      { status: 204 },
      { status: 200, body: [civic] },
    );
    await screen.findByRole('article', { name: 'Toyota Corolla' });
    const user = userEvent.setup();

    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Delete' }));
    await user.click(vehicleRow('Toyota Corolla').getByRole('button', { name: 'Confirm delete' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Deleted Toyota Corolla');
    expect(screen.queryByRole('article', { name: 'Toyota Corolla' })).not.toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles', 'DELETE /api/vehicles/1', 'GET /api/vehicles']);
  });

  it('restock rejects a non-positive amount before calling the API', async () => {
    const fetchMock = renderAs(adminSession, '/admin', { status: 200, body: [civic] });
    await screen.findByRole('article', { name: 'Honda Civic' });
    const user = userEvent.setup();

    await user.type(vehicleRow('Honda Civic').getByLabelText('Restock amount'), '0');
    await user.click(vehicleRow('Honda Civic').getByRole('button', { name: 'Restock' }));

    expect(vehicleRow('Honda Civic').getByText(/whole number above 0/i)).toBeInTheDocument();
    expect(requests(fetchMock)).toEqual(['GET /api/vehicles']);
  });

  it('restocking a valid amount calls the API and refreshes the list', async () => {
    const fetchMock = renderAs(
      adminSession,
      '/admin',
      { status: 200, body: [civic] },
      { status: 200, body: { ...civic, quantity: 3 } },
      { status: 200, body: [{ ...civic, quantity: 3 }] },
    );
    await screen.findByRole('article', { name: 'Honda Civic' });
    const user = userEvent.setup();

    await user.type(vehicleRow('Honda Civic').getByLabelText('Restock amount'), '3');
    await user.click(vehicleRow('Honda Civic').getByRole('button', { name: 'Restock' }));

    expect(await vehicleRow('Honda Civic').findByText('3 in stock')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Restocked Honda Civic');
    expect(requests(fetchMock)).toEqual([
      'GET /api/vehicles',
      'POST /api/vehicles/2/restock',
      'GET /api/vehicles',
    ]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ amount: 3 });
  });
});
