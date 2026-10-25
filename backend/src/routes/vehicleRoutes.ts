import { RequestHandler, Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';
import { requireAdmin } from '../middleware/auth';

/** Every vehicle route needs a valid JWT; inventory changes also need an admin, purchases do not. */
export function vehicleRoutes(controller: VehicleController, requireAuth: RequestHandler): Router {
  const router = Router();
  router.use(requireAuth);
  router.get('/', controller.list);
  // Registered before any /:id route so "search" is never captured as a vehicle id.
  router.get('/search', controller.search);
  router.post('/', requireAdmin, controller.create);
  router.put('/:id', requireAdmin, controller.update);
  router.delete('/:id', requireAdmin, controller.delete);
  router.post('/:id/purchase', controller.purchase);
  router.post('/:id/restock', requireAdmin, controller.restock);
  return router;
}
