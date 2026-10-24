import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { ValidationError } from '../errors';

const HTTP_CREATED = 201;
const MIN_PASSWORD_LENGTH = 8;

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const user = await this.authService.register(parsed.data.email, parsed.data.password);
    res.status(HTTP_CREATED).json(user);
  };
}
