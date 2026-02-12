import AuthForm from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign Up - Firefly' };

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      <AuthForm mode="signup" />
    </div>
  );
}
