import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import type { Credentials } from '../api/authApi';
import type { FieldErrors } from '../auth/validation';
import { TextField } from './TextField';
import { primaryButton } from './styles';

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
      setServerError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    // overflow-hidden keeps the drifting glows from causing horizontal scroll on small screens.
    <div className="relative isolate min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-1/4 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.09),transparent_65%)] blur-3xl motion-safe:animate-drift" />
        <div className="absolute -bottom-1/3 -left-1/4 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(148_163_184/0.08),transparent_65%)] blur-3xl motion-safe:animate-drift-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-canvas)_100%)]" />
      </div>

      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12 motion-safe:animate-fade-rise">
        <div className="mb-12 text-center">
          {/* The negative right margin cancels the trailing letter-spacing so the wordmark centres optically. */}
          <h1 className="mr-[-0.5em] text-2xl font-light tracking-[0.5em] uppercase sm:text-3xl">AutoStock</h1>
          <div
            aria-hidden="true"
            className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-ink-muted to-transparent"
          />
        </div>

        <div className="border border-line/80 bg-surface/70 p-6 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.9)] backdrop-blur-sm sm:p-8">
          <h2 className="mb-6 text-xs tracking-[0.3em] text-ink-muted uppercase">{title}</h2>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 [&_input]:transition-[border-color,box-shadow] [&_input]:duration-200 [&_input]:motion-reduce:transition-none [&_input:focus]:shadow-[0_0_0_3px_rgb(255_255_255/0.12)] [&_input:hover:not(:focus,[aria-invalid=true])]:border-ink-muted"
          >
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
              className={`mt-2 w-full py-3 tracking-wide transition duration-200 enabled:hover:bg-neutral-200 enabled:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:active:scale-100 ${primaryButton}`}
            >
              {submitting ? submittingLabel : submitLabel}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:underline-offset-8 [&_a]:motion-reduce:transition-none [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ink">
          {footer}
        </p>
      </main>
    </div>
  );
}
