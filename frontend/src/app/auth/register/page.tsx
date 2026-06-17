import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { vi } from '@/lib/i18n';

export default function RegisterPage() {
  return (
    <AuthLayout
      title={vi.auth.createAccount}
      subtitle={vi.auth.registerSubtitle}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
