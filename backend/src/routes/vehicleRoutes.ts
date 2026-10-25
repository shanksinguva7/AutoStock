import { RequestHandler, Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';
import { requireAdmin } from '../middleware/auth';

/** Every vehicle route needs a valid JWT; writes additionally need an admin. */
export function vehicleRoutes(controller: VehicleController, requireAuth: RequestHandler): Router {
  const router = Router();
  router.use(requireAuth);
  router.post('/', requireAdmin, controller.create);
  return router;
}
