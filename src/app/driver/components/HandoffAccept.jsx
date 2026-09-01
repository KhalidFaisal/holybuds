'use client';

import { useState } from 'react';

export default function HandoffAccept({ handoff, driverId, onAccepted }) {
  const [loading, setLoading] = useState(false);

  const actualCounts = JSON.parse(handoff.actualInventory);
  const box = handoff.box;
  const from = handoff.fromDriver;

  const acceptHandoff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/driver/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${driverId}`
        },
        body: JSON.stringify({
          action: 'ACCEPT',
          handoffId: handoff.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Box accepted successfully!');
        onAccepted();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error accepting handoff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-pc-dark border border-pc-border rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pending Handoff</h1>
          <p className="text-pc-muted">
            <strong className="text-white">{from.name}</strong> has handed off <strong className="text-white">{box.name}</strong> to you. 
            You must verify the physical contents below before you can start your shift.
          </p>
        </div>

        <div className="bg-pc-black rounded-xl p-4 border border-pc-border space-y-3 mb-6 max-h-64 overflow-y-auto">
          {Object.entries(actualCounts).map(([productId, count]) => {
            const product = box.items?.find(i => i.productId === productId)?.product;
            const productName = product ? product.name : productId;
            return (
              <div key={productId} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                 <span className="text-pc-muted font-bold">{productName}</span>
                 <span className="text-white font-bold bg-white/10 px-3 py-1 rounded">{count} Items</span>
              </div>
            );
          })}
        </div>

        <button 
          onClick={acceptHandoff}
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors"
        >
          {loading ? 'Accepting...' : 'I Confirm This Count'}
        </button>
      </div>
    </div>
  );
}
