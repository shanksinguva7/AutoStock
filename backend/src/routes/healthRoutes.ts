import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

export function healthRoutes(controller: HealthController): Router {
  const router = Router();
  router.get('/', controller.getHealth);
  return router;
}
