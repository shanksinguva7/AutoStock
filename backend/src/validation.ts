import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Parses untrusted input against a zod schema.
 * @throws ValidationError (400) listing every failed rule.
 */
export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join('; '));
  }
  return parsed.data;
}
