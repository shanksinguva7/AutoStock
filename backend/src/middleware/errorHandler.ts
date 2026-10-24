import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';

const HTTP_INTERNAL_ERROR = 500;

/** Maps AppError subclasses to their status; anything else is a 500 with no details leaked. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(HTTP_INTERNAL_ERROR).json({ error: 'Internal server error' });
}
