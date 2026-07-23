import LoginForm from './LoginForm';

export const metadata = {
  title: 'Login - Holybuds',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pc-green/10 via-pc-black to-pc-black z-0" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
