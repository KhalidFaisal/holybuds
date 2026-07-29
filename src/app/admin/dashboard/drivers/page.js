'use client';

import { useState, useEffect } from 'react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPin, setNewPin] = useState('0000');
  const [addLoading, setAddLoading] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState(null);
  
  // Payout State
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutDriver, setPayoutDriver] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/admin/drivers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (!res.ok) throw new Error('Failed to load drivers');
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!newPhone && !newEmail) {
      setError('Please provide either a phone number or an email address.');
      return;
    }
    setAddLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ name: newName, phone: newPhone, email: newEmail, referralCode: newCode, pin: newPin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create driver');
      
      setIsAddOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewCode('');
      setNewPin('0000');
      fetchDrivers(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!payoutDriver) return;
    setPayoutLoading(true);
    
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          id: payoutDriver.id, 
          action: 'PAYOUT',
          amount: parseFloat(payoutAmount) || payoutDriver.pendingPayout
        })
      });
      if (!res.ok) throw new Error('Failed to payout driver');
      
      setIsPayoutOpen(false);
      setPayoutDriver(null);
      setPayoutAmount('');
      fetchDrivers();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  const openEditModal = (driver) => {
    setEditDriverId(driver.id);
    setNewName(driver.name);
    setNewPhone(driver.phone);
    setNewEmail(driver.email || '');
    setNewCode(driver.referralCode);
    setNewPin(driver.pin);
    setIsEditOpen(true);
  };

  const handleEditDriver = async (e) => {
    e.preventDefault();
    if (!newPhone && !newEmail) {
      setError('Please provide either a phone number or an email address.');
      return;
    }
    setAddLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ id: editDriverId, name: newName, phone: newPhone, email: newEmail, referralCode: newCode, pin: newPin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update driver');
      
      setIsEditOpen(false);
      setEditDriverId(null);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewCode('');
      setNewPin('0000');
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to completely delete this driver? This might fail if they have past referrals.')) return;
    try {
      const res = await fetch(`/api/admin/drivers?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete driver');
      fetchDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ id, isActive: !isActive })
      });
      if (!res.ok) throw new Error('Failed to update driver');
      fetchDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Drivers</h1>
          <p className="text-pc-muted">Manage referral codes, track payouts, and view driver progress.</p>
        </div>
        <button
          onClick={() => {
            setNewName('');
            setNewPhone('');
            setNewEmail('');
            setNewCode('');
            setNewPin('0000');
            setError('');
            setIsAddOpen(true);
          }}
          className="btn-primary whitespace-nowrap"
        >
          + Add Driver
        </button>
      </div>

      {loading ? (
        <div className="text-pc-muted text-center py-12">Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="bg-pc-dark border border-pc-border rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 text-pc-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No Drivers Found</h3>
          <p className="text-pc-muted mb-6">You haven't added any drivers yet.</p>
          <button onClick={() => setIsAddOpen(true)} className="btn-secondary">
            Add First Driver
          </button>
        </div>
      ) : (
        <div className="bg-pc-dark border border-pc-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pc-black border-b border-pc-border">
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Driver</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Code</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Referrals / Bonuses</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Total Earned</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Paid</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider">Pending</th>
                  <th className="p-4 text-xs font-semibold text-pc-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pc-border">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-pc-black/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${driver.isActive ? 'bg-pc-green' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-medium text-white">{driver.name}</div>
                          <div className="text-xs text-pc-muted">{driver.phone} {driver.email ? `• ${driver.email}` : ''} • PIN: {driver.pin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-pc-black px-2 py-1 rounded text-pc-green font-bold">
                        {driver.referralCode}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-white">{driver._count.referrals} Refs</div>
                      <div className="text-xs text-pc-muted">{driver._count.bonuses} Bonuses</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">${driver.totalEarned.toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-pc-green font-medium">${(driver.totalEarned - driver.pendingPayout).toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <div className={`font-bold ${driver.pendingPayout > 0 ? 'text-yellow-400' : 'text-pc-muted'}`}>
                        ${driver.pendingPayout.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <div className="flex justify-end gap-2">
                        {driver.pendingPayout > 0 && (
                          <button
                            onClick={() => { setPayoutDriver(driver); setPayoutAmount(driver.pendingPayout); setIsPayoutOpen(true); }}
                            className="px-3 py-1 bg-pc-green/20 text-pc-green rounded hover:bg-pc-green hover:text-black transition-colors text-sm font-medium"
                          >
                            Payout
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(driver)}
                          className="px-3 py-1 bg-pc-border text-pc-muted rounded hover:bg-pc-border/80 hover:text-white transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(driver.id, driver.isActive)}
                          className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                            driver.isActive 
                              ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white' 
                              : 'bg-pc-border text-pc-muted hover:text-white'
                          }`}
                        >
                          {driver.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Driver</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-pc-muted hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. Mike Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Phone Number (Optional Login)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. 555-0123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Email Address (Optional Login)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. mike@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Unique Referral Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none font-mono"
                  placeholder="e.g. MIKE10"
                />
                <p className="text-xs text-pc-muted mt-1">This code will be embedded in their QR code link.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">4-Digit Login PIN</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{4}"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none font-mono"
                  placeholder="0000"
                  maxLength={4}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-primary"
                >
                  {addLoading ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Driver</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-pc-muted hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEditDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. Mike Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Phone Number (Optional Login)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. 555-0123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Email Address (Optional Login)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none"
                  placeholder="e.g. mike@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Unique Referral Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none font-mono"
                  placeholder="e.g. MIKE10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">4-Digit Login PIN</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{4}"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:border-pc-green focus:outline-none font-mono"
                  placeholder="0000"
                  maxLength={4}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-primary"
                >
                  {addLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {isPayoutOpen && payoutDriver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Payout Driver</h2>
              <button onClick={() => setIsPayoutOpen(false)} className="text-pc-muted hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handlePayout} className="space-y-4">
              <div className="bg-pc-black/50 p-4 rounded-xl border border-pc-border/50 text-center mb-4">
                <p className="text-pc-muted text-sm mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-400">${payoutDriver.pendingPayout.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Amount to Pay</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pc-muted font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={payoutDriver.pendingPayout}
                    required
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="w-full bg-pc-black border border-pc-border rounded-xl pl-8 pr-4 py-3 text-white focus:border-pc-green focus:outline-none text-lg font-bold"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayoutOpen(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex-1 btn-primary py-3"
                >
                  {payoutLoading ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
