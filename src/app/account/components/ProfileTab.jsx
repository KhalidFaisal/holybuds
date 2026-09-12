'use client';

import { useState } from 'react';

function parseAddress(rawAddr = '') {
  if (!rawAddr) return { streetAddress: '', town: '', zipCode: '' };
  const parts = rawAddr.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return {
      streetAddress: parts[0],
      town: parts[1],
      zipCode: parts[2],
    };
  }
  return {
    streetAddress: rawAddr,
    town: '',
    zipCode: '',
  };
}

export default function ProfileTab({ user, customerProfile, setCustomerProfile }) {
  const [editing, setEditing] = useState(false);

  const initialParsed = parseAddress(customerProfile?.address);
  const [formData, setFormData] = useState({
    name: customerProfile?.name || '',
    phone: customerProfile?.phone || '',
    streetAddress: initialParsed.streetAddress,
    town: initialParsed.town,
    zipCode: initialParsed.zipCode,
    birthdate: customerProfile?.birthdate || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleStartEdit = () => {
    const parsed = parseAddress(customerProfile?.address);
    setFormData({
      name: customerProfile?.name || '',
      phone: customerProfile?.phone || '',
      streetAddress: parsed.streetAddress,
      town: parsed.town,
      zipCode: parsed.zipCode,
      birthdate: customerProfile?.birthdate || '',
    });
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const combinedAddress = [
      formData.streetAddress?.trim(),
      formData.town?.trim(),
      formData.zipCode?.trim(),
    ].filter(Boolean).join(', ');

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: combinedAddress,
          birthdate: formData.birthdate,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setCustomerProfile(data.customer);
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const currentParsed = parseAddress(customerProfile?.address);

  // Format birthdate for display (e.g. "October 14")
  const formatBirthdate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split('-');
      if (month && day) {
        const d = new Date(year || 2000, Number(month) - 1, Number(day));
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile & Address Card */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-pc-border">
          <div>
            <h2 className="text-xl font-bold text-white">Contact & Delivery Information</h2>
            <p className="text-xs text-pc-muted mt-0.5">
              These address fields automatically populate at checkout for faster delivery.
            </p>
          </div>
          {!editing && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-pc-green/10 hover:bg-pc-green/20 text-pc-green border border-pc-green/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Edit Details
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>Profile updated successfully!</span>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* 3 Delivery Address Fields matching Checkout */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-pc-green mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Delivery Address (Autofills at Checkout)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-pc-muted mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main St, Apt 4"
                    value={formData.streetAddress}
                    onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-pc-muted mb-1">Town / City *</label>
                    <input
                      type="text"
                      required
                      placeholder="New York"
                      value={formData.town}
                      onChange={e => setFormData({ ...formData, town: e.target.value })}
                      className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-pc-muted mb-1">Zip Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="10001"
                      value={formData.zipCode}
                      onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Birthdate Field */}
            <div className="pt-2 border-t border-pc-border/60">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-pc-muted uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75m0 0-1.5-.75m1.5.75V15m-15 4.5 1.5.75m0 0 1.5-.75m-1.5.75V15" />
                  </svg>
                  <span>Birthdate (Optional)</span>
                </label>
                <span className="text-[10px] text-pc-green font-bold bg-pc-green/10 border border-pc-green/20 px-2 py-0.5 rounded-full">
                  Birthday Reward
                </span>
              </div>
              <input
                type="date"
                value={formData.birthdate}
                onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
              />
              <p className="text-[11px] text-pc-muted mt-1">
                Add your birthday so we can automatically grant your exclusive birthday discount & rewards!
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-pc-border/60">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs font-bold text-pc-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 py-2 text-xs font-bold shadow-md shadow-pc-green/20"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider block mb-1">Name</span>
              <p className="text-white font-bold text-base">{customerProfile?.name || user?.name || 'Not set'}</p>
            </div>

            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider flex justify-between items-center mb-1">
                <span>Phone</span>
                {customerProfile?.phone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pc-green/20 text-pc-green font-bold">
                    Active
                  </span>
                )}
              </span>
              <p className="text-white font-mono text-base font-bold">{customerProfile?.phone || 'Not set'}</p>
            </div>

            {/* Address display broken down by checkout fields */}
            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40 md:col-span-2 space-y-3">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Saved Delivery Address</span>
              </span>

              {customerProfile?.address ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-pc-black/40 p-2.5 rounded-lg border border-pc-border/30 sm:col-span-2">
                    <span className="text-[10px] text-pc-muted block">Street Address</span>
                    <span className="text-white font-medium text-xs">{currentParsed.streetAddress || 'Not set'}</span>
                  </div>
                  <div className="bg-pc-black/40 p-2.5 rounded-lg border border-pc-border/30">
                    <span className="text-[10px] text-pc-muted block">City / Town</span>
                    <span className="text-white font-medium text-xs">{currentParsed.town || 'Not set'}</span>
                  </div>
                  <div className="bg-pc-black/40 p-2.5 rounded-lg border border-pc-border/30">
                    <span className="text-[10px] text-pc-muted block">Zip Code</span>
                    <span className="text-white font-mono text-xs">{currentParsed.zipCode || 'Not set'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-pc-muted italic">
                  No delivery address saved yet. Click &quot;Edit Details&quot; to add your address for automatic checkout filling.
                </p>
              )}
            </div>

            {/* Birthdate display */}
            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40 md:col-span-2">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75m0 0-1.5-.75m1.5.75V15m-15 4.5 1.5.75m0 0 1.5-.75m-1.5.75V15" />
                  </svg>
                  <span>Birthdate</span>
                </span>
                {customerProfile?.birthdate && (
                  <span className="text-[10px] text-pc-green font-bold bg-pc-green/10 border border-pc-green/30 px-2 py-0.5 rounded-full">
                    Birthday Discount Active
                  </span>
                )}
              </span>

              {customerProfile?.birthdate ? (
                <p className="text-white font-bold text-sm">
                  {formatBirthdate(customerProfile.birthdate)}
                </p>
              ) : (
                <p className="text-xs text-pc-muted italic">
                  Not set. Add your birthdate to unlock special birthday treats!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Security & Connected Auth */}
      <div className="glass-card p-6 md:p-8">
        <h3 className="text-base font-bold text-white mb-1">Account Security</h3>
        <p className="text-xs text-pc-muted mb-4">Your account is secured via authenticated sign-in credentials.</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-pc-dark/50 rounded-xl border border-pc-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pc-card flex items-center justify-center border border-pc-border text-pc-green">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sign-in Provider</p>
              <p className="text-xs text-pc-muted">{user?.email ? `Connected: ${user.email}` : 'Signed in via credentials'}</p>
            </div>
          </div>

          <span className="text-xs font-bold text-pc-green bg-pc-green/10 border border-pc-green/30 px-3 py-1 rounded-full w-fit">
            Verified Session
          </span>
        </div>
      </div>
    </div>
  );
}
