'use client';

import { useState, useMemo } from 'react';
import { groupAndSortBoxItems, CategoryIcon } from '@/lib/inventorySorting';

export default function HandoffAccept({ handoff, driverId, onAccepted }) {
  const [loading, setLoading] = useState(false);

  const actualCounts = useMemo(() => {
    try {
      return typeof handoff.actualInventory === 'string'
        ? JSON.parse(handoff.actualInventory)
        : (handoff.actualInventory || {});
    } catch (e) {
      return {};
    }
  }, [handoff.actualInventory]);

  const box = handoff.box;
  const boxItems = box?.items;
  const from = handoff.fromDriver;

  const groupedHandoffItems = useMemo(() => {
    const list = Object.entries(actualCounts).map(([productId, count]) => {
      const product = boxItems?.find(i => i.productId === productId)?.product || { id: productId, name: productId };
      return {
        id: productId,
        productId,
        product,
        count,
        expectedQuantity: count
      };
    });
    return groupAndSortBoxItems(list);
  }, [actualCounts, boxItems]);

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
      let data = {};
      try {
        data = await res.json();
      } catch (e) {}
      if (res.ok) {
        alert('Box accepted successfully!');
        onAccepted();
      } else {
        alert(data.error || 'Failed to accept handoff');
      }
    } catch (err) {
      alert(err.message || 'Error accepting handoff');
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

        <div className="bg-pc-black rounded-xl p-4 border border-pc-border space-y-4 mb-6 max-h-64 overflow-y-auto">
          {groupedHandoffItems.length > 0 ? (
            groupedHandoffItems.map(group => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon type={group.iconType} className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-pc-muted font-semibold">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center text-sm py-1 border-b border-white/5 last:border-0">
                      <span className="text-pc-muted font-medium text-xs sm:text-sm">{item.product.name}</span>
                      <span className="text-white font-bold bg-white/10 px-2.5 py-0.5 rounded text-xs">{item.count} Items</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-pc-muted text-center py-2">No items in box.</p>
          )}
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
