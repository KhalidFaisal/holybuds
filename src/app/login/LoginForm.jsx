'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Auto login after registration
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (signInRes?.error) {
          throw new Error('Logged in failed after registration');
        }
        
        router.push('/account');
        router.refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await signIn('credentials', {
          redirect: false,
          email,
          password
        });
        
        if (res?.error) {
          throw new Error('Invalid email or password');
        }
        
        router.push('/account');
        router.refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/account' }, { prompt: 'select_account' });
  };

  return (
    <div className="glass-card p-8 rounded-2xl w-full border border-pc-border animate-scale-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-pc-muted">
          {isRegistering 
            ? 'Sign up to track orders and earn rewards.' 
            : 'Sign in to access your account and rewards.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-pc-border"></div>
        <span className="text-pc-muted text-sm">or</span>
        <div className="flex-1 h-px bg-pc-border"></div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pc-green transition-colors"
              placeholder="John Doe"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-pc-muted mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pc-green transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pc-muted mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pc-green transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pc-green text-pc-black font-bold py-3 px-4 rounded-xl hover:bg-pc-green/90 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-pc-muted">
        {isRegistering ? (
          <>
            Already have an account?{' '}
            <button onClick={() => setIsRegistering(false)} className="text-pc-green hover:underline focus:outline-none">
              Sign In
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button onClick={() => setIsRegistering(true)} className="text-pc-green hover:underline focus:outline-none">
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
