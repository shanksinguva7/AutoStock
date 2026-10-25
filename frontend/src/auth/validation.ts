import type { Credentials } from '../api/authApi';

export type FieldErrors = Partial<Record<keyof Credentials, string>>;

// Matches the backend's register rule, so users see the problem before a round trip.
export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

/** Login only checks presence and email shape; password rules belong to registration. */
export function validateLogin({ email, password }: Credentials): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function validateRegistration({ email, password }: Credentials): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return errors;
}
