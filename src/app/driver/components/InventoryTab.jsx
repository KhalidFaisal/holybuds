'use client';

import { useState, useEffect } from 'react';

export default function InventoryTab({ driver, refreshDriver }) {
  const [isHandoffMode, setIsHandoffMode] = useState(false);
  const [actualCounts, setActualCounts] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [selectedNextDriver, setSelectedNextDriver] = useState('');
  const [loading, setLoading] = useState(false);

  const box = driver.currentBox;

  useEffect(() => {
    // Fetch drivers for the handoff dropdown
    if (isHandoffMode) {
      fetch('/api/admin/drivers') // we can reuse this if accessible, or create a public driver list
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setDrivers(data.filter(d => d.id !== driver.id && d.isActive));
          } else if (data && data.drivers) {
            setDrivers(data.drivers.filter(d => d.id !== driver.id && d.isActive));
          }
        })
        .catch(console.error);
    }
  }, [isHandoffMode, driver.id]);

  const handleCountChange = (productId, val) => {
    setActualCounts(prev => ({
      ...prev,
      [productId]: parseInt(val) || 0
    }));
  };

  const submitHandoff = async () => {
    if (!selectedNextDriver) return alert('Select the next driver');
    
    // Ensure all items have a count
    for (const item of box.items) {
      if (actualCounts[item.productId] === undefined) {
        return alert(`Please enter actual count for ${item.product.name}`);
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/driver/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${driver.id}`
        },
        body: JSON.stringify({
          action: 'CREATE',
          toDriverId: selectedNextDriver,
          actualInventory: actualCounts
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Handoff initiated successfully. The next driver must log in and accept it.');
        refreshDriver(); // this should clear their currentBox since it's pending
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error initiating handoff');
    } finally {
      setLoading(false);
    }
  };

  if (!box) {
    return (
      <div className="bg-pc-dark border border-pc-border rounded-xl p-8 text-center text-pc-muted">
        You do not have a box assigned to you right now.
      </div>
    );
  }

  if (!isHandoffMode) {
    return (
      <div className="space-y-6">
        <div className="bg-pc-dark border border-pc-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Box: {box.name}</h2>
          
          <div className="space-y-3">
            {box.items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-pc-black rounded-lg p-4 border border-pc-border">
                <span className="font-bold text-white">{item.product.name}</span>
                <span className="text-pc-green font-bold bg-pc-green/10 px-4 py-1 rounded-full">
                  {item.expectedQuantity} Expected
                </span>
              </div>
            ))}
            {box.items.length === 0 && (
              <div className="text-pc-muted text-center py-4">Box is empty.</div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setIsHandoffMode(true)}
          className="w-full btn-primary py-3 font-bold text-lg"
        >
          End Shift & Handoff Box
        </button>
      </div>
    );
  }

  // Handoff Mode
  return (
    <div className="space-y-6">
      <div className="bg-pc-dark border border-pc-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Shift Handoff: {box.name}</h2>
          <button onClick={() => setIsHandoffMode(false)} className="text-pc-muted hover:text-white text-sm font-bold">Cancel</button>
        </div>

        <p className="text-pc-muted text-sm mb-6">
          Enter the exact physical count of what is currently in your box. The system will calculate any discrepancies.
        </p>

        <div className="space-y-4 mb-6">
          {box.items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-pc-black rounded-lg p-4 border border-pc-border gap-4">
              <div className="flex-1">
                <p className="font-bold text-white">{item.product.name}</p>
                <p className="text-xs text-pc-muted">Expected: {item.expectedQuantity}</p>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  className="w-full bg-pc-dark border border-pc-border rounded-lg px-3 py-2 text-white text-center font-bold focus:border-pc-green focus:outline-none"
                  value={actualCounts[item.productId] ?? ''}
                  onChange={(e) => handleCountChange(item.productId, e.target.value)}
                  placeholder="Actual"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-pc-muted mb-2">Next Driver</label>
          <select 
            className="w-full bg-pc-black border border-pc-border rounded-lg px-4 py-3 text-white focus:outline-none"
            value={selectedNextDriver}
            onChange={e => setSelectedNextDriver(e.target.value)}
          >
            <option value="">Select the driver taking over...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={submitHandoff}
          disabled={loading}
          className="w-full bg-pc-green text-black font-bold py-3 rounded-lg hover:bg-pc-green/90 transition-colors"
        >
          {loading ? 'Processing...' : 'Complete Physical Count'}
        </button>
      </div>
    </div>
  );
}
