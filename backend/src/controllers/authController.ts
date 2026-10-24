import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { ValidationError } from '../errors';
import { HttpStatus } from '../httpStatus';

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
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const user = await this.authService.register(parsed.data.email, parsed.data.password);
    res.status(HttpStatus.CREATED).json(user);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const result = await this.authService.login(parsed.data.email, parsed.data.password);
    res.status(HttpStatus.OK).json(result);
  };
}
