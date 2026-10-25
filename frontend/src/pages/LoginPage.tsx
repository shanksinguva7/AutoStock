import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateLogin, type FieldErrors } from '../auth/validation';
import { ApiError } from '../api/client';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validateLogin({ email, password });
    setFieldErrors(errors);
    setServerError('');
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-10 text-center text-lg tracking-[0.4em] uppercase">AutoStock</h1>
      <h2 className="mb-6 text-sm tracking-[0.25em] text-ink-muted uppercase">Log in</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <p role="alert" className="border border-error px-3 py-2 text-sm text-error">
            {serverError}
          </p>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className="w-full border border-line bg-surface px-3 py-2 text-base text-ink focus:border-ink focus:outline-none"
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-sm text-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            className="w-full border border-line bg-surface px-3 py-2 text-base text-ink focus:border-ink focus:outline-none"
          />
          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-sm text-error">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink py-2.5 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:bg-disabled disabled:text-ink-muted"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </main>
  );
}
