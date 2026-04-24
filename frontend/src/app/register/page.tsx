import { RegisterForm } from '../../features/auth/ui/RegisterForm';
import { AuthPageShell } from '../../features/auth/ui/AuthPageShell';

export default function RegisterPage() {
  return (
    <AuthPageShell>
      <RegisterForm />
    </AuthPageShell>
  );
}
