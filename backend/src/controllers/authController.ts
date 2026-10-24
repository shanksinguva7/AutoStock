import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { HttpStatus } from '../httpStatus';
import { parseOrThrow } from '../validation';

const MIN_PASSWORD_LENGTH = 8;

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
});

// Login only checks presence; password rules belong to registration.
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseOrThrow(registerSchema, req.body);
    const user = await this.authService.register(email, password);
    res.status(HttpStatus.CREATED).json(user);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseOrThrow(loginSchema, req.body);
    const result = await this.authService.login(email, password);
    res.status(HttpStatus.OK).json(result);
  };
}
