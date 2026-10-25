import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { Credentials } from '../api/authApi';
import type { FieldErrors } from '../auth/validation';
import { TextField } from './TextField';

const UNEXPECTED_ERROR = 'Something went wrong. Please try again.';

interface AuthFormProps {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  passwordAutoComplete: 'current-password' | 'new-password';
  validate(credentials: Credentials): FieldErrors;
  onSubmit(credentials: Credentials): Promise<void>;
  footer: ReactNode;
}

/**
 * Shared email + password form for login and register: validates locally first,
 * shows the server's message on failure, and opens the dashboard on success.
 */
export function AuthForm({
  title,
  submitLabel,
  submittingLabel,
  passwordAutoComplete,
  validate,
  onSubmit,
  footer,
}: AuthFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate({ email, password });
    setFieldErrors(errors);
    setServerError('');
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ email, password });
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-10 text-center text-lg tracking-[0.4em] uppercase">AutoStock</h1>
      <h2 className="mb-6 text-sm tracking-[0.25em] text-ink-muted uppercase">{title}</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <p role="alert" className="border border-error px-3 py-2 text-sm text-error">
            {serverError}
          </p>
        )}
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink py-2.5 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:bg-disabled disabled:text-ink-muted"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">{footer}</p>
    </main>
  );
}
