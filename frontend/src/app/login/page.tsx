import { LoginForm } from '../../features/auth/ui/LoginForm';
import { AuthPageShell } from '../../features/auth/ui/AuthPageShell';

export default function LoginPage() {
  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  );
}
