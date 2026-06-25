'use client';

import { useState } from 'react';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Incorrect password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95 bg-hero-gradient relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 text-center px-6 max-w-md w-full animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="Holybuds" 
            className="w-64 mx-auto animate-float object-contain"
          />
        </div>

        {/* Password Form */}
        <div className="glass-card p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Enter Password
          </h2>
          <p className="text-pc-muted text-sm mb-6">
            This site is protected. Please enter the password to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="bg-pc-dark border border-pc-border text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-pc-green transition-all w-full text-center"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full btn-primary text-lg py-4"
              id="password-submit"
            >
              Enter
            </button>
          </form>
        </div>

        <p className="text-pc-muted/50 text-xs">
          By entering this site, you confirm that you are of legal age in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
