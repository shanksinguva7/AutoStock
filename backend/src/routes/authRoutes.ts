import { Router } from 'express';
import { AuthController } from '../controllers/authController';

export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/register', controller.register);
  return router;
}
