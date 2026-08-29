'use client';

import { useState, useEffect } from 'react';
import OrdersTab from './components/OrdersTab';
import InventoryTab from './components/InventoryTab';
import HandoffAccept from './components/HandoffAccept';

export default function DriverPortal() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  
  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState('ORDERS');

  useEffect(() => {
    const savedPhone = localStorage.getItem('driver_auth_phone');
    const savedPin = localStorage.getItem('driver_auth_pin');
    if (savedPhone && savedPin) {
      login(savedPhone, savedPin);
    } else {
      setIsCheckingAuth(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const refreshDriver = () => {
    const p = localStorage.getItem('driver_auth_phone');
    const n = localStorage.getItem('driver_auth_pin');
    if (p && n) login(p, n);
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

  const pendingHandoff = driver.pendingHandoffs && driver.pendingHandoffs.length > 0 ? driver.pendingHandoffs[0] : null;

  return (
    <div className="min-h-screen bg-pc-black p-4 sm:p-8">
      {pendingHandoff && (
        <HandoffAccept 
          handoff={pendingHandoff} 
          driverId={driver.id} 
          onAccepted={refreshDriver} 
        />
      )}

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

        {/* Navigation Tabs */}
        <div className="flex bg-pc-dark rounded-xl p-1 border border-pc-border">
          {['DASHBOARD', 'ORDERS', 'INVENTORY'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-pc-black text-white shadow' 
                  : 'text-pc-muted hover:text-white'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
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
              <h2 className="text-lg font-bold text-white mb-2 relative z-10">Next ${driver.bonusAmount || 100} Bonus Progress</h2>
              <p className="text-pc-muted text-sm mb-4 relative z-10">
                You have {driver.progressToBonus} out of {driver.bonusThreshold} referrals needed for your next bonus.
              </p>
              
              <div className="w-full bg-pc-black rounded-full h-4 border border-pc-border relative z-10">
                <div 
                  className="bg-pc-green h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(driver.progressToBonus / driver.bonusThreshold) * 100}%` }}
                />
              </div>
            </div>

            {/* QR Code & Link */}
            <div className="bg-pc-dark border border-pc-border p-6 rounded-2xl text-center space-y-6">
              <h2 className="text-lg font-bold text-white">Your Referral QR Code</h2>
              <div className="inline-block bg-white p-4 rounded-xl">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div>
                <button 
                  onClick={downloadQRCode}
                  className="px-6 py-2 bg-pc-green text-black rounded-lg text-sm font-bold hover:bg-pc-green/90 transition-colors"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ORDERS' && <OrdersTab driverId={driver.id} />}
        
        {activeTab === 'INVENTORY' && <InventoryTab driver={driver} refreshDriver={refreshDriver} />}

      </div>
    </div>
  );
}
