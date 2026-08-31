'use client';

import { useState, useEffect } from 'react';

export default function AdminInventory() {
  const [boxes, setBoxes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [restockModalBoxId, setRestockModalBoxId] = useState(null);
  const [restockCounts, setRestockCounts] = useState({});
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [logsModalBox, setLogsModalBox] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [bRes, dRes, pRes] = await Promise.all([
        fetch('/api/admin/inventory/boxes'),
        fetch('/api/admin/drivers'),
        fetch('/api/products?all=true')
      ]);

      if (bRes.ok) setBoxes((await bRes.json()).boxes || []);
      if (dRes.ok) setDrivers(await dRes.json() || []);
      if (pRes.ok) {
        const pData = await pRes.json() || [];
        // Only show active products and sort alphabetically
        const activeProducts = pData
          .filter(p => p.isVisible)
          .sort((a, b) => a.name.localeCompare(b.name));
        setProducts(activeProducts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createBox = async (name) => {
    if (!name) return;
    try {
      const res = await fetch('/api/admin/inventory/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', name })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const assignBox = async (boxId, driverId) => {
    try {
      const res = await fetch('/api/admin/inventory/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASSIGN', boxId, driverId })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openRestock = (boxId) => {
    setRestockModalBoxId(boxId);
    setRestockCounts({});
  };

  const submitRestock = async () => {
    try {
      const res = await fetch('/api/admin/inventory/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'RESTOCK', 
          boxId: restockModalBoxId, 
          itemsToAdd: restockCounts 
        })
      });
      if (res.ok) {
        setRestockModalBoxId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-pc-muted animate-pulse">Loading Inventory...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Inventory Boxes</h1>
          <p className="text-pc-muted">Track what is inside each physical box.</p>
        </div>
        <button 
          onClick={() => {
            const name = prompt('Enter new box name (e.g. Box 1)');
            createBox(name);
          }}
          className="btn-primary py-2 px-4"
        >
          + Add Box
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {boxes.map(box => (
          <div key={box.id} className="bg-pc-dark border border-pc-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="min-w-0 pr-2">
                <h2 className="text-xl font-bold text-white mb-2 truncate">{box.name}</h2>
                {box.driver ? (
                  <span className="inline-block whitespace-nowrap text-pc-green text-xs font-bold bg-pc-green/10 px-2 py-1 rounded">
                    Assigned: {box.driver.name}
                  </span>
                ) : (
                  <span className="inline-block whitespace-nowrap text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded">
                    Unassigned
                  </span>
                )}
              </div>
              <div className="flex flex-nowrap gap-1.5 flex-shrink-0">
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to completely RESET the inventory for ${box.name} to 0?`)) {
                      fetch('/api/admin/inventory/boxes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'RESET', boxId: box.id })
                      }).then(res => { if(res.ok) fetchData() });
                    }
                  }}
                  className="text-[11px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 hover:bg-yellow-200 px-2 py-1 rounded transition-colors"
                  title="Reset Inventory to 0"
                >
                  Reset
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to DELETE ${box.name}? This will clear all its inventory and history.`)) {
                      fetch('/api/admin/inventory/boxes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'DELETE', boxId: box.id })
                      }).then(res => { if(res.ok) fetchData() });
                    }
                  }}
                  className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                  title="Delete Box"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setLogsModalBox(box)}
                  className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                  title="View History & Discrepancies"
                >
                  Logs
                </button>
                <button 
                  onClick={() => openRestock(box.id)}
                  className="text-[11px] font-bold text-pc-green bg-pc-green/10 border border-pc-green/20 hover:bg-pc-green/20 px-2 py-1 rounded transition-colors"
                >
                  Restock
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-pc-muted uppercase mb-2">Re-Assign To Driver</label>
              <select 
                value={box.currentDriverId || ''}
                onChange={e => assignBox(box.id, e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="">Unassigned</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-pc-muted uppercase">Current Expected Inventory</h3>
              <button 
                onClick={() => setExpandedBoxes(prev => ({ ...prev, [box.id]: !prev[box.id] }))}
                className="text-xs font-bold text-pc-green hover:text-white transition-colors"
              >
                {expandedBoxes[box.id] ? 'Collapse ▲' : 'Expand ▼'}
              </button>
            </div>
            
            {expandedBoxes[box.id] && (
              <div className="space-y-2">
                {box.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-pc-black rounded-lg p-3 border border-pc-border">
                    <span className="text-white text-sm">{item.product.name}</span>
                    <span className="font-bold text-white bg-white/10 px-3 py-1 rounded">
                      {item.expectedQuantity}
                    </span>
                  </div>
                ))}
                {box.items.length === 0 && (
                  <p className="text-pc-muted text-sm italic">Box is empty.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {restockModalBoxId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-pc-dark border border-pc-border rounded-3xl p-8 max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2">Restock Box</h2>
            <p className="text-pc-muted mb-6">Enter the quantities you are adding to the box.</p>
            
            <div className="overflow-y-auto flex-1 space-y-4 mb-6 pr-2">
              {products.map(product => {
                const currentQty = boxes.find(b => b.id === restockModalBoxId)?.items.find(i => i.productId === product.id)?.expectedQuantity || 0;
                return (
                  <div key={product.id} className="flex items-center justify-between bg-pc-black rounded-lg p-3 border border-pc-border">
                    <div className="flex-1 pr-4">
                      <p className="text-white text-sm font-bold">{product.name}</p>
                      <p className="text-xs text-pc-muted">Current Expected: {currentQty}</p>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        placeholder="Add +"
                        value={restockCounts[product.id] || ''}
                        onChange={e => setRestockCounts(prev => ({ ...prev, [product.id]: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-pc-dark border border-pc-border rounded-lg px-2 py-1.5 text-white text-center text-sm focus:outline-none focus:border-pc-green"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setRestockModalBoxId(null)}
                className="flex-1 border border-pc-border text-white rounded-lg py-3 font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitRestock}
                className="flex-1 btn-primary py-3 font-bold"
              >
                Apply Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {logsModalBox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-pc-dark border border-pc-border rounded-3xl p-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Logs & History: {logsModalBox.name}</h2>
              <button onClick={() => setLogsModalBox(null)} className="text-pc-muted hover:text-white font-bold">Close</button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {(() => {
                const logs = (logsModalBox.logs || []).filter(l => l.type !== 'HANDOFF').map(l => ({ ...l, _model: 'log' }));
                const handoffs = (logsModalBox.handoffs || []).map(h => ({ ...h, _model: 'handoff' }));
                const timeline = [...logs, ...handoffs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                if (timeline.length === 0) {
                  return <p className="text-pc-muted">No history found for this box.</p>;
                }

                return timeline.map(item => {
                  const date = new Date(item.createdAt).toLocaleString();
                  if (item._model === 'log') {
                    let detailsObj = {};
                    try { detailsObj = JSON.parse(item.details); } catch(e){}
                    
                    return (
                      <div key={`log-${item.id}`} className="bg-pc-black border border-pc-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-white bg-white/10 px-2 py-1 rounded text-xs">{item.type}</span>
                          <span className="text-xs text-pc-muted">{date}</span>
                        </div>
                        {item.type === 'RESTOCK' ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">Items Restocked:</p>
                            {Object.entries(detailsObj).map(([pid, qty]) => {
                              const pName = products.find(p => p.id === pid)?.name || `Product ${pid.slice(-6)}`;
                              return <div key={pid}>• {pName}: +{qty}</div>
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-pc-muted mt-2">{detailsObj.note || item.details}</p>
                        )}
                      </div>
                    );
                  } else {
                    let discObj = {};
                    try { discObj = JSON.parse(item.discrepancies); } catch(e){}
                    const hasDiscrepancies = Object.keys(discObj).length > 0;
                    
                    return (
                      <div key={`handoff-${item.id}`} className="bg-pc-black border border-pc-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-xs border border-yellow-500/20">HANDOFF - {item.status}</span>
                          <span className="text-xs text-pc-muted">{date}</span>
                        </div>
                        <p className="text-sm text-white mb-2">
                          From <span className="font-bold">{item.fromDriver?.name}</span> to <span className="font-bold">{item.toDriver?.name}</span>
                        </p>
                        
                        {hasDiscrepancies ? (
                          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                            <p className="text-red-400 font-bold text-xs uppercase mb-2">Discrepancies Found</p>
                            {Object.entries(discObj).map(([pid, data]) => {
                              const pName = products.find(p => p.id === pid)?.name || 'Unknown Product';
                              const diffNum = data.diff;
                              return (
                                <div key={pid} className="flex justify-between text-sm text-white mb-1">
                                  <span>{pName}</span>
                                  <span className="font-bold text-red-400">{diffNum > 0 ? `+${diffNum}` : diffNum}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-pc-green font-bold bg-pc-green/10 border border-pc-green/20 px-3 py-2 rounded-lg inline-block">
                            No Discrepancies (Perfect Match)
                          </div>
                        )}
                      </div>
                    );
                  }
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
