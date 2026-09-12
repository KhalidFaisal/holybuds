'use client';

import { useState } from 'react';

export default function ProfileTab({ user, customerProfile, setCustomerProfile }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: customerProfile?.name || '',
    phone: customerProfile?.phone || '',
    address: customerProfile?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleStartEdit = () => {
    setFormData({
      name: customerProfile?.name || '',
      phone: customerProfile?.phone || '',
      address: customerProfile?.address || '',
    });
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Card */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-pc-border">
          <div>
            <h2 className="text-xl font-bold text-white">Contact & Delivery Information</h2>
            <p className="text-xs text-pc-muted mt-0.5">Keep your address and phone number up to date for smooth deliveries.</p>
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
            <span>✓</span> Profile updated successfully!
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Mobile Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none font-mono"
              />
              <p className="text-[11px] text-pc-muted mt-1">Drivers will contact this number upon arrival.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Delivery Address & Instructions</label>
              <textarea
                value={formData.address}
                placeholder="123 Main St, Apt 4B, City, ZIP (Include gate codes or delivery notes)"
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none h-24 resize-none"
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider block mb-1">Name</span>
              <p className="text-white font-bold text-base">{customerProfile?.name || user?.name || 'Not provided'}</p>
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
              <p className="text-white font-mono text-base font-bold">{customerProfile?.phone || 'Not provided'}</p>
            </div>

            <div className="bg-pc-dark/40 p-4 rounded-xl border border-pc-border/40 md:col-span-2">
              <span className="text-[11px] font-bold text-pc-muted uppercase tracking-wider block mb-1">Primary Delivery Address</span>
              <p className="text-white text-sm leading-relaxed">
                {customerProfile?.address || (
                  <span className="text-pc-muted italic">No delivery address saved yet. Click &quot;Edit Details&quot; to add one.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Security & Connected Auth */}
      <div className="glass-card p-6 md:p-8">
        <h3 className="text-base font-bold text-white mb-2">Account Security</h3>
        <p className="text-xs text-pc-muted mb-4">Your account is secured via authenticated sign-in credentials.</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-pc-dark/50 rounded-xl border border-pc-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pc-card flex items-center justify-center text-lg border border-pc-border">
              🔐
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
