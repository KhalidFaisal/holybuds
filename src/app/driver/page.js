'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DriverPortal() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  
  const [driver, setDriver] = useState(null);
  
  // QRCode library could be used here, but for simplicity we'll just show the link and maybe an image of a generic QR code or let the admin generate it for them, or we can use an external API.
  
  useEffect(() => {
    // Check if already logged in via localStorage
    const savedPhone = localStorage.getItem('driver_auth_phone');
    const savedPin = localStorage.getItem('driver_auth_pin');
    if (savedPhone && savedPin) {
      login(savedPhone, savedPin);
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    login(phone, pin);
  };

  const login = async (p, n) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p, pin: n })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setDriver(data);
      localStorage.setItem('driver_auth_phone', p);
      localStorage.setItem('driver_auth_pin', n);
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('driver_auth_phone');
      localStorage.removeItem('driver_auth_pin');
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('driver_auth_phone');
    localStorage.removeItem('driver_auth_pin');
    setDriver(null);
    setPhone('');
    setPin('');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-pc-black flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-pc-muted">Loading...</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-pc-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-pc-dark border border-pc-border rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Driver Portal</h1>
            <p className="text-pc-muted">Log in to track your referrals and earnings.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Phone or Email</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-3 text-white focus:border-pc-green focus:outline-none focus:ring-1 focus:ring-pc-green transition-all"
                placeholder="e.g. 555-0123 or me@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">4-Digit PIN</label>
              <input
                type="password"
                required
                pattern="[0-9]{4}"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pc-green font-mono tracking-widest text-lg"
                placeholder="••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-bold mt-4"
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${driver.referralCode}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(referralLink)}`;

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Holybuds-Referral-${driver.referralCode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code', err);
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-pc-black p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-pc-dark border border-pc-border p-4 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold text-white">Welcome, {driver.name}</h1>
            <p className="text-sm text-pc-muted">Referral Code: <span className="font-mono text-pc-green font-bold">{driver.referralCode}</span></p>
          </div>
          <button onClick={logout} className="text-sm font-medium text-pc-muted hover:text-white transition-colors">
            Log Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pc-dark border border-pc-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-pc-muted text-xs uppercase font-bold tracking-wider mb-1">Total Earned</span>
            <span className="text-2xl font-black text-white">${driver.totalEarned.toFixed(2)}</span>
          </div>
          
          <div className="bg-pc-dark border border-pc-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-pc-muted text-xs uppercase font-bold tracking-wider mb-1">Pending Payout</span>
            <span className="text-2xl font-black text-yellow-400">${driver.pendingPayout.toFixed(2)}</span>
          </div>

          <div className="bg-pc-dark border border-pc-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-pc-muted text-xs uppercase font-bold tracking-wider mb-1">Referrals</span>
            <span className="text-2xl font-black text-white">{driver.totalReferrals}</span>
          </div>

          <div className="bg-pc-dark border border-pc-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-pc-muted text-xs uppercase font-bold tracking-wider mb-1">Bonuses</span>
            <span className="text-2xl font-black text-pc-green">{driver.totalBonuses}</span>
          </div>
        </div>

        {/* Bonus Progress */}
        <div className="bg-pc-dark border border-pc-border p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-pc-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2 relative z-10">Next $100 Bonus Progress</h2>
          <p className="text-pc-muted text-sm mb-4 relative z-10">
            You have {driver.progressToBonus} out of {driver.bonusThreshold} referrals needed for your next bonus.
          </p>
          
          <div className="w-full bg-pc-black rounded-full h-4 border border-pc-border relative z-10">
            <div 
              className="bg-pc-green h-full rounded-full transition-all duration-1000"
              style={{ width: `${(driver.progressToBonus / driver.bonusThreshold) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-pc-muted mt-2 relative z-10">
            <span>0</span>
            <span>{driver.bonusThreshold}</span>
          </div>
        </div>

        {/* QR Code & Link */}
        <div className="bg-pc-dark border border-pc-border p-6 rounded-2xl text-center space-y-6">
          <h2 className="text-lg font-bold text-white">Your Referral QR Code</h2>
          <p className="text-pc-muted text-sm">Have customers scan this to automatically apply your referral code and get their discount!</p>
          
          <div className="inline-block bg-white p-4 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
          </div>

          <div>
            <button 
              onClick={downloadQRCode}
              className="px-6 py-2 bg-pc-green text-black rounded-lg text-sm font-bold hover:bg-pc-green/90 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
          </div>

          <div>
            <p className="text-xs text-pc-muted uppercase font-bold mb-2">Or share your link manually:</p>
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input 
                type="text" 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-pc-black border border-pc-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  alert('Copied to clipboard!');
                }}
                className="px-3 py-2 bg-pc-green/20 text-pc-green rounded-lg text-sm font-bold hover:bg-pc-green hover:text-black transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
