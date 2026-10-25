import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateLogin } from '../auth/validation';
import { AuthForm } from '../components/AuthForm';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      submittingLabel="Logging in…"
      passwordAutoComplete="current-password"
      validate={validateLogin}
      onSubmit={login}
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    />
  );
}
