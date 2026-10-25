import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateRegistration } from '../auth/validation';
import { AuthForm } from '../components/AuthForm';

export function RegisterPage() {
  const { register } = useAuth();

  return (
    <AuthForm
      title="Create account"
      submitLabel="Create account"
      submittingLabel="Creating account…"
      passwordAutoComplete="new-password"
      validate={validateRegistration}
      onSubmit={register}
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-ink underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    />
  );
}
