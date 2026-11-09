'use client';

import { useState, useEffect } from 'react';
import { groupAndSortBoxItems, groupAndSortProducts, CategoryIcon } from '@/lib/inventorySorting';
import { DEFAULT_SHEET_URL, DEFAULT_SHEET_TAB, COLUMN_MAPPING } from '@/lib/sheetInventoryImport';

function InlineEditQuantity({ boxId, productId, initialQuantity, onUpdate }) {
  const [editValue, setEditValue] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setEditValue(initialQuantity);
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed) || parsed === initialQuantity) {
      setEditValue(null);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/inventory/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'EDIT_COUNTS', 
          boxId, 
          itemsToSet: { [productId]: parsed } 
        })
      });
      if (res.ok) {
        onUpdate();
      } else {
        setEditValue(null);
      }
    } catch (err) {
      console.error(err);
      setEditValue(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        value={editValue !== null ? editValue : initialQuantity}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === 'Enter') handleBlur();
          if (e.key === 'Escape') {
            setEditValue(null);
            setIsEditing(false);
          }
        }}
        disabled={isSaving}
        className="w-16 bg-pc-dark border border-pc-green rounded px-2 py-1 text-white text-center text-sm font-bold focus:outline-none disabled:opacity-50"
      />
    );
  }

  return (
    <span 
      onClick={startEditing}
      className={`font-bold text-white bg-white/10 hover:bg-white/20 cursor-pointer px-3 py-1 rounded transition-colors ${isSaving ? 'opacity-50 animate-pulse' : ''}`}
      title="Click to edit"
    >
      {initialQuantity}
    </span>
  );
}

function getBoxAlerts(box, productsList = []) {
  if (!box || !Array.isArray(productsList)) return [];
  return productsList.filter(product => {
    // Exclude wholesale and accessories items
    const cat = (product.category || '').toLowerCase();
    if (cat === 'wholesale' || cat === 'accessories' || cat === 'accessory') return false;

    // Main site inventory must have at least 5 units
    if ((product.stock || 0) < 5) return false;

    // Expected quantity currently in this box (0 if row does not exist)
    const currentQty = box.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;

    // Category slug 'flowers' check (preserves 'flowers' category slug)
    const isFlower = product.category === 'flowers' || cat === 'flowers';
    return isFlower ? currentQty <= 2 : currentQty < 2;
  }).map(product => {
    const currentQty = box.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;
    return {
      id: product.id,
      product,
      expectedQuantity: currentQty
    };
  });
}

function getBoxSplitSuggestions(currentBox, allBoxes = [], productsList = []) {
  if (!currentBox || !Array.isArray(allBoxes) || !Array.isArray(productsList)) return [];

  // Exclude items that can be restocked from main site inventory (Restock Alerts)
  const restockAlerts = getBoxAlerts(currentBox, productsList);
  const restockableIds = new Set(restockAlerts.map(i => i.id));

  return productsList.filter(product => {
    // Simply exclude the items from split that can be restocked
    if (restockableIds.has(product.id)) return false;

    // Exclude wholesale and accessories items
    const cat = (product.category || '').toLowerCase();
    if (cat === 'wholesale' || cat === 'accessories' || cat === 'accessory') return false;

    // Current box must have 0 of this product
    const currentQty = currentBox.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;
    if (currentQty > 0) return false;

    // Check if at least one other box has 2 or more units of this product
    const donorBoxes = allBoxes
      .filter(b => b.id !== currentBox.id)
      .map(b => {
        const qty = b.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;
        return { boxId: b.id, boxName: b.name, quantity: qty };
      })
      .filter(d => d.quantity >= 2);

    return donorBoxes.length > 0;
  }).map(product => {
    const donorBoxes = allBoxes
      .filter(b => b.id !== currentBox.id)
      .map(b => {
        const qty = b.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;
        return { boxId: b.id, boxName: b.name, quantity: qty };
      })
      .filter(d => d.quantity >= 2);

    return {
      id: product.id,
      product,
      donors: donorBoxes
    };
  });
}

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
  const [alertsModalBox, setAlertsModalBox] = useState(null);
  const [splitModalBox, setSplitModalBox] = useState(null);
  const [actionMenuBoxId, setActionMenuBoxId] = useState(null);

  // Google Sheet Import State
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [sheetTab, setSheetTab] = useState(DEFAULT_SHEET_TAB);
  const [sheetTargetBoxId, setSheetTargetBoxId] = useState('');
  const [sheetColumnKey, setSheetColumnKey] = useState('BOX_1');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetApplying, setSheetApplying] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [sheetSuccessMsg, setSheetSuccessMsg] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [previewTab, setPreviewTab] = useState('MATCHED');
  const [previewSearch, setPreviewSearch] = useState('');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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

  const openSheetImport = (boxId = null) => {
    setSheetError('');
    setPreviewData(null);
    setPreviewSearch('');
    setPreviewTab('MATCHED');

    let chosenBoxId = boxId;
    if (!chosenBoxId && boxes.length > 0) {
      const box1 = boxes.find(b => (b.name || '').includes('1')) || boxes[0];
      chosenBoxId = box1.id;
    }
    setSheetTargetBoxId(chosenBoxId || '');

    const targetBox = boxes.find(b => b.id === chosenBoxId);
    if ((targetBox?.name || '').includes('2')) {
      setSheetColumnKey('BOX_2');
    } else if ((targetBox?.name || '').includes('3')) {
      setSheetColumnKey('BOX_3');
    } else if ((targetBox?.name || '').includes('4')) {
      setSheetColumnKey('BOX_4');
    } else {
      setSheetColumnKey('BOX_1');
    }

    setIsSheetModalOpen(true);
  };

  const handleBoxSelect = (boxId) => {
    setSheetTargetBoxId(boxId);
    setPreviewData(null);
    const selectedBox = boxes.find(b => b.id === boxId);
    if ((selectedBox?.name || '').includes('2')) {
      setSheetColumnKey('BOX_2');
    } else if ((selectedBox?.name || '').includes('3')) {
      setSheetColumnKey('BOX_3');
    } else if ((selectedBox?.name || '').includes('4')) {
      setSheetColumnKey('BOX_4');
    } else if ((selectedBox?.name || '').includes('1')) {
      setSheetColumnKey('BOX_1');
    }
  };

  const fetchSheetPreview = async () => {
    if (!sheetTargetBoxId) {
      setSheetError('Please select a target box.');
      return;
    }
    setSheetLoading(true);
    setSheetError('');
    setPreviewData(null);
    try {
      const res = await fetch('/api/admin/inventory/sheet-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PREVIEW',
          sheetUrl,
          sheetTab,
          boxId: sheetTargetBoxId,
          columnKey: sheetColumnKey
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch preview from sheet');
      }
      setPreviewData(data);
    } catch (err) {
      setSheetError(err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  const applySheetImport = async () => {
    if (!previewData || !sheetTargetBoxId) return;
    setSheetApplying(true);
    setSheetError('');
    try {
      const itemsToSet = {};
      (previewData.matched || []).forEach(item => {
        itemsToSet[item.productId] = item.newQty;
      });

      const targetBox = boxes.find(b => b.id === sheetTargetBoxId);

      const res = await fetch('/api/admin/inventory/sheet-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY',
          boxId: sheetTargetBoxId,
          boxName: targetBox?.name || 'Box',
          columnKey: sheetColumnKey,
          sheetUrl,
          sheetTab,
          itemsToSet
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply sheet import');
      }

      setSheetSuccessMsg(`Successfully imported counts from Google Sheet (${previewData.columnLabel || sheetColumnKey}) into ${targetBox?.name || 'Box'}! (${data.totalUnits} units across ${data.updatedCount} products)`);
      setTimeout(() => setSheetSuccessMsg(''), 8000);
      setIsSheetModalOpen(false);
      setPreviewData(null);
      fetchData(true);
    } catch (err) {
      setSheetError(err.message);
    } finally {
      setSheetApplying(false);
    }
  };

  if (loading) {
    return <div className="text-pc-muted animate-pulse">Loading Inventory...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Inventory Boxes</h1>
          <p className="text-pc-muted">Track what is inside each physical box.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openSheetImport()}
            className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm border-pc-green/40 hover:border-pc-green text-pc-green hover:bg-pc-green/10 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.5V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span>Import from Sheet</span>
          </button>
          <button 
            onClick={() => {
              const name = prompt('Enter new box name (e.g. Box 1)');
              createBox(name);
            }}
            className="btn-primary py-2 px-4 text-sm"
          >
            + Add Box
          </button>
        </div>
      </div>

      {sheetSuccessMsg && (
        <div className="p-4 rounded-xl border border-pc-green/50 bg-pc-green/10 text-pc-green text-sm font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <span>{sheetSuccessMsg}</span>
          <button onClick={() => setSheetSuccessMsg('')} className="text-white hover:text-pc-green text-xs font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {boxes.map(box => (
          <div key={box.id} className="bg-pc-dark border border-pc-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-5 gap-2">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-xl font-bold text-white mb-1.5 truncate">{box.name}</h2>
                <div>
                  {box.driver ? (
                    <span className="inline-block whitespace-nowrap text-pc-green text-xs font-bold bg-pc-green/10 px-2 py-0.5 rounded">
                      Assigned: {box.driver.name}
                    </span>
                  ) : (
                    <span className="inline-block whitespace-nowrap text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 w-48">
                <div className="flex items-center gap-1.5 w-full">
                  <button 
                    onClick={() => setLogsModalBox(box)}
                    className="h-7 flex-1 flex items-center justify-center text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="View History & Discrepancies"
                  >
                    Logs
                  </button>
                  <button 
                    onClick={() => openRestock(box.id)}
                    className="h-7 flex-1 flex items-center justify-center text-[11px] font-bold text-pc-green bg-pc-green/10 border border-pc-green/20 hover:bg-pc-green/20 rounded-lg transition-colors"
                  >
                    Restock
                  </button>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuBoxId(actionMenuBoxId === box.id ? null : box.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-[11px] font-bold text-pc-muted hover:text-white bg-pc-black border border-pc-border hover:bg-white/5 rounded-lg transition-colors"
                      title="More options"
                    >
                      •••
                    </button>
                    {actionMenuBoxId === box.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-20" 
                          onClick={() => setActionMenuBoxId(null)} 
                        />
                        <div className="absolute right-0 mt-1 w-36 bg-pc-dark border border-pc-border rounded-xl shadow-2xl py-1 z-30">
                          <button
                            onClick={() => {
                              setActionMenuBoxId(null);
                              openSheetImport(box.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-pc-green hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                          >
                            <span>↓</span> Import Sheet
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuBoxId(null);
                              if (confirm(`Are you sure you want to completely RESET the inventory for ${box.name} to 0?`)) {
                                fetch('/api/admin/inventory/boxes', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'RESET', boxId: box.id })
                                }).then(res => { if (res.ok) fetchData(); });
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-yellow-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <span>↺</span> Reset to 0
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuBoxId(null);
                              if (confirm(`Are you sure you want to DELETE ${box.name}? This will clear all its inventory and history.`)) {
                                fetch('/api/admin/inventory/boxes', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'DELETE', boxId: box.id })
                                }).then(res => { if (res.ok) fetchData(); });
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <span>✕</span> Delete Box
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Alert & Split positioned directly under Logs and Restock with exact same total width */}
                {(() => {
                  const alerts = getBoxAlerts(box, products);
                  const splits = getBoxSplitSuggestions(box, boxes, products);
                  if (alerts.length === 0 && splits.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5 w-full mt-1.5">
                      {alerts.length > 0 && (
                        <button 
                          onClick={() => setAlertsModalBox(box)}
                          className="h-7 flex-1 flex items-center justify-center text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-lg transition-colors animate-pulse truncate px-1"
                          title="Low Stock Alerts"
                        >
                          Alerts ({alerts.length})
                        </button>
                      )}
                      {splits.length > 0 && (
                        <button 
                          onClick={() => setSplitModalBox(box)}
                          className="h-7 flex-1 flex items-center justify-center text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 rounded-lg transition-colors animate-pulse truncate px-1"
                          title="Items at 0 in this box with 2+ in another box"
                        >
                          Split ({splits.length})
                        </button>
                      )}
                    </div>
                  );
                })()}
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
                {(() => {
                  const splits = getBoxSplitSuggestions(box, boxes, products);
                  if (splits.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-between text-xs mb-2">
                      <span className="text-purple-300 font-medium flex items-center gap-1.5">
                        <span>⚡</span>
                        <span><strong>{splits.length}</strong> item{splits.length !== 1 ? 's' : ''} with 0 can be split from other boxes</span>
                      </span>
                      <button 
                        onClick={() => setSplitModalBox(box)}
                        className="text-[11px] font-bold text-purple-400 hover:text-white underline ml-2 whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })()}

                {(() => {
                  const groupedCategories = groupAndSortBoxItems(box.items);
                  if (groupedCategories.length === 0) {
                    return <p className="text-pc-muted text-sm italic">Box is empty.</p>;
                  }

                  return (
                    <div className="space-y-3.5">
                      {groupedCategories.map((group) => (
                        <div key={group.label} className="space-y-1.5">
                          {/* Category Header with Icon and Unit Total */}
                          <div className="flex items-center justify-between px-2.5 py-1 bg-white/[0.04] border-l-2 border-pc-green rounded-r-lg">
                            <div className="flex items-center gap-2">
                              <CategoryIcon type={group.iconType} className="w-3.5 h-3.5" />
                              <span className="text-xs font-black text-white uppercase tracking-wider">
                                {group.label}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-pc-muted bg-pc-black px-2 py-0.5 rounded border border-pc-border">
                              {group.totalQuantity} {group.totalQuantity === 1 ? 'unit' : 'units'}
                            </span>
                          </div>

                          {/* Items sorted A-Z in this category */}
                          <div className="space-y-1.5">
                            {group.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center bg-pc-black rounded-lg p-2.5 border border-pc-border hover:border-pc-green/30 transition-colors">
                                <span className="text-white text-sm font-medium">{item.product.name}</span>
                                <InlineEditQuantity 
                                  boxId={box.id} 
                                  productId={item.productId} 
                                  initialQuantity={item.expectedQuantity} 
                                  onUpdate={() => fetchData(true)} 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
            
            <div className="overflow-y-auto flex-1 space-y-5 mb-6 pr-2">
              {(() => {
                const groupedProducts = groupAndSortProducts(products);
                const targetBox = boxes.find(b => b.id === restockModalBoxId);

                return groupedProducts.map(group => (
                  <div key={group.label} className="space-y-2">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-pc-dark/95 border-l-2 border-pc-green rounded-r-lg sticky top-0 z-10 backdrop-blur-md shadow-sm">
                      <div className="flex items-center gap-2">
                        <CategoryIcon type={group.iconType} className="w-3.5 h-3.5" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          {group.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-pc-muted bg-pc-black px-2 py-0.5 rounded border border-pc-border">
                        {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.products.map(product => {
                        const currentQty = targetBox?.items?.find(i => i.productId === product.id)?.expectedQuantity || 0;
                        return (
                          <div key={product.id} className="flex items-center justify-between bg-pc-black rounded-lg p-3 border border-pc-border hover:border-pc-green/40 transition-colors">
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
                  </div>
                ));
              })()}
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
                          <span className={`font-bold px-2 py-1 rounded text-xs ${
                            item.type === 'RESTOCK' ? 'text-pc-green bg-pc-green/10 border border-pc-green/20' :
                            item.type === 'ORDER_CLAIM' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' :
                            item.type === 'ORDER_SWAP' ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' :
                            item.type === 'AUDIT' ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' :
                            'text-white bg-white/10'
                          }`}>{item.type}</span>
                          <span className="text-xs text-pc-muted">{date}</span>
                        </div>
                        {item.type === 'RESTOCK' ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">Items Restocked:</p>
                            {Object.entries(detailsObj).map(([pid, val]) => {
                              const qty = typeof val === 'object' ? val.qty : val;
                              const savedName = typeof val === 'object' ? val.name : null;
                              const pName = savedName || products.find(p => p.id === pid)?.name || `Product ${pid.slice(-6)}`;
                              return <div key={pid}>• {pName}: +{qty}</div>
                            })}
                          </div>
                        ) : item.type === 'AUDIT' && detailsObj.edits ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">{detailsObj.note || 'Audit Edits:'}</p>
                            {Object.entries(detailsObj.edits).map(([pid, val]) => {
                              if (typeof val === 'object' && val !== null) {
                                const pName = val.name || products.find(p => p.id === pid)?.name || `Product ${pid.slice(-6)}`;
                                const sign = val.diff > 0 ? '+' : '';
                                return (
                                  <div key={pid} className="flex justify-between items-center text-xs mb-1">
                                    <span>• {pName}</span>
                                    <span className={val.diff > 0 ? 'text-pc-green font-bold' : val.diff < 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                                      {val.old} → {val.new} ({sign}{val.diff})
                                    </span>
                                  </div>
                                );
                              } else {
                                const pName = products.find(p => p.id === pid)?.name || `Product ${pid.slice(-6)}`;
                                return <div key={pid} className="text-xs mb-1">• {pName}: set to {val}</div>
                              }
                            })}
                          </div>
                        ) : item.type === 'SHIFT_SUMMARY' && detailsObj.sales ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">{detailsObj.note}</p>
                            <div className="bg-white/5 rounded p-3 mt-2 border border-white/10">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-pc-green">Total Sales:</span>
                                <span className="font-bold text-pc-green">${detailsObj.totalSalesAmount?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-pc-muted mb-1">
                                <span>Cash:</span>
                                <span>${(detailsObj.totalCash || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-pc-muted mb-1">
                                <span>Zelle:</span>
                                <span>${(detailsObj.totalZelle || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-red-400 font-bold mb-3 pb-2 border-b border-white/10">
                                <span>Owed:</span>
                                <span>${(detailsObj.totalOwed || 0).toFixed(2)}</span>
                              </div>
                              {Object.keys(detailsObj.sales).length > 0 ? (
                                Object.entries(detailsObj.sales).map(([pid, data]) => (
                                  <div key={pid} className="flex justify-between items-center text-xs mb-1">
                                    <span>• {data.name}</span>
                                    <span className="text-white">{data.qty} sold (${data.totalValue?.toFixed(2)})</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic">No sales recorded during this shift.</p>
                              )}
                            </div>
                          </div>
                        ) : item.type === 'ORDER_SWAP' ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">{detailsObj.note}</p>
                            <div className="bg-white/5 rounded p-3 mt-2 border border-white/10">
                              <p className="text-xs text-red-400 mb-1 line-through"><span className="text-gray-500">Original:</span> {detailsObj.original}</p>
                              <p className="text-xs text-pc-green"><span className="text-gray-400">Swapped To:</span> {detailsObj.swapped}</p>
                            </div>
                          </div>
                        ) : item.type === 'ORDER_CLAIM' ? (
                          <div className="text-sm text-pc-muted mt-2">
                            <p className="font-semibold text-white mb-1">{detailsObj.note}</p>
                            {Array.isArray(detailsObj.deductions) && detailsObj.deductions.length > 0 && (
                              <div className="bg-white/5 rounded p-3 mt-2 border border-white/10 space-y-1">
                                {detailsObj.deductions.map((d, i) => (
                                  <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="text-white">• {d.name}</span>
                                    <span className="font-bold text-red-400">-{d.quantity} units</span>
                                  </div>
                                ))}
                              </div>
                            )}
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
                            {Object.entries(discObj).map(([pid, diffData]) => {
                              const pName = diffData.name || products.find(p => p.id === pid)?.name || 'Unknown Product';
                              const diffNum = diffData.diff;
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

      {/* Alerts Modal */}
      {alertsModalBox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-pc-dark w-full max-w-lg rounded-2xl p-6 border border-pc-border shadow-2xl relative max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2">Restock Alerts: {alertsModalBox.name}</h2>
            <p className="text-pc-muted mb-4">Items running low in this box but available in main site inventory.</p>
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {getBoxAlerts(alertsModalBox, products).map(item => (
                <div key={item.id} className="bg-pc-black border border-pc-border rounded-md px-3 py-2 flex justify-between items-center">
                  <div className="truncate pr-3">
                    <h3 className="font-bold text-white text-sm truncate" title={item.product.name}>{item.product.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                    <div className="text-right">
                      <span className="text-pc-muted text-[11px] uppercase mr-1">Box</span>
                      <span className="text-red-400 font-bold">{item.expectedQuantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-pc-muted text-[11px] uppercase mr-1">Site</span>
                      <span className="text-pc-green font-bold">{item.product.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  const box = alertsModalBox;
                  setAlertsModalBox(null);
                  openRestock(box.id);
                }}
                className="flex-1 py-3 bg-pc-green text-black rounded-lg font-bold hover:bg-pc-green/90 transition-colors"
              >
                Restock Now
              </button>
              <button 
                onClick={() => setAlertsModalBox(null)}
                className="flex-1 py-3 bg-pc-black border border-pc-border rounded-lg text-white font-bold hover:bg-pc-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Suggestions Modal */}
      {splitModalBox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-pc-dark w-full max-w-lg rounded-2xl p-6 border border-pc-border shadow-2xl relative max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-1">Split Suggestions: {splitModalBox.name}</h2>
            <p className="text-pc-muted mb-4 text-xs">
              These items are currently at <strong className="text-red-400">0</strong> in {splitModalBox.name}, but have 2+ units in another driver&apos;s box that can be split.
            </p>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {getBoxSplitSuggestions(splitModalBox, boxes, products).map(item => (
                <div key={item.id} className="bg-pc-black border border-pc-border rounded-xl p-3.5">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-white text-sm truncate" title={item.product.name}>
                      {item.product.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                      0 in {splitModalBox.name}
                    </span>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-xs">
                    <p className="text-pc-muted text-[11px] font-semibold uppercase tracking-wider">
                      Available to split from:
                    </p>
                    {item.donors.map(donor => (
                      <div key={donor.boxId} className="flex justify-between items-center text-xs">
                        <span className="text-white font-medium">• {donor.boxName}</span>
                        <span className="text-pc-green font-bold font-mono">
                          {donor.quantity} in box (suggest splitting 1)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  const box = splitModalBox;
                  setSplitModalBox(null);
                  openRestock(box.id);
                }}
                className="flex-1 py-3 bg-pc-green text-black rounded-lg font-bold hover:bg-pc-green/90 transition-colors text-sm"
              >
                Restock {splitModalBox.name}
              </button>
              <button 
                onClick={() => setSplitModalBox(null)}
                className="flex-1 py-3 bg-pc-black border border-pc-border rounded-lg text-white font-bold hover:bg-pc-border transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheet Import Modal */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-pc-dark w-full max-w-4xl rounded-2xl p-5 sm:p-6 border border-pc-border shadow-2xl relative max-h-[92vh] flex flex-col text-left">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-pc-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Import Box Counts from Google Sheet</span>
                </h2>
                <p className="text-pc-muted text-xs mt-0.5">
                  Exact name matching, skip wholesale &amp; accessories, and set blanks to 0.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSheetModalOpen(false);
                  setPreviewData(null);
                }}
                className="w-8 h-8 rounded-lg bg-pc-black border border-pc-border hover:bg-white/10 text-pc-muted hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Target Box & Column Selectors */}
            <div className="bg-pc-black/60 border border-pc-border rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-pc-muted uppercase mb-1">
                    Target Inventory Box
                  </label>
                  <select
                    value={sheetTargetBoxId}
                    onChange={e => handleBoxSelect(e.target.value)}
                    className="w-full bg-pc-dark border border-pc-border rounded-lg px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-pc-green"
                  >
                    {boxes.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.driver ? `(${b.driver.name})` : '(Unassigned)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-pc-muted uppercase mb-1">
                    Source Column
                  </label>
                  <select
                    value={sheetColumnKey}
                    onChange={e => {
                      setSheetColumnKey(e.target.value);
                      setPreviewData(null);
                    }}
                    className="w-full bg-pc-dark border border-pc-border rounded-lg px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-pc-green"
                  >
                    {Object.entries(COLUMN_MAPPING).map(([key, col]) => (
                      <option key={key} value={key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchSheetPreview}
                    disabled={sheetLoading || !sheetTargetBoxId}
                    className="w-full py-2 px-4 bg-pc-green text-black font-bold rounded-lg text-xs hover:bg-pc-green/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {sheetLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Fetching Sheet...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.5V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        <span>{previewData ? 'Re-fetch Preview' : 'Fetch & Preview Counts'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Badges & Advanced Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-pc-border/40 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Exact Name Match
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                    Skip Wholesale &amp; Accessories
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Blanks = 0
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                  className="text-pc-muted hover:text-white underline font-medium cursor-pointer"
                >
                  {showAdvancedConfig ? 'Hide Sheet Settings ▲' : 'Edit Sheet URL / Tab ▼'}
                </button>
              </div>

              {/* Advanced Settings */}
              {showAdvancedConfig && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-pc-border/30">
                  <div>
                    <label className="block text-[10px] font-bold text-pc-muted uppercase mb-1">
                      Google Sheet URL
                    </label>
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={e => {
                        setSheetUrl(e.target.value);
                        setPreviewData(null);
                      }}
                      className="w-full bg-pc-dark border border-pc-border rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-pc-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-pc-muted uppercase mb-1">
                      Tab Name
                    </label>
                    <input
                      type="text"
                      value={sheetTab}
                      onChange={e => {
                        setSheetTab(e.target.value);
                        setPreviewData(null);
                      }}
                      className="w-full bg-pc-dark border border-pc-border rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-pc-green"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {sheetError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center justify-between">
                <span>{sheetError}</span>
                <button onClick={() => setSheetError('')} className="underline text-[11px] font-bold ml-2">Dismiss</button>
              </div>
            )}

            {/* Preview Section */}
            {sheetLoading && !previewData && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-pc-muted space-y-3">
                <span className="w-8 h-8 border-2 border-pc-green border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">Fetching Google Sheet and comparing exact product names...</p>
              </div>
            )}

            {!sheetLoading && !previewData && !sheetError && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-pc-muted border border-dashed border-pc-border rounded-xl">
                <svg className="w-10 h-10 text-pc-muted/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-sm font-bold text-white mb-1">Ready to Preview</p>
                <p className="text-xs max-w-md">
                  Click &quot;Fetch &amp; Preview Counts&quot; above to inspect all exact matches, blanks, and excluded categories before updating this box.
                </p>
              </div>
            )}

            {previewData && (
              <div className="flex-1 overflow-hidden flex flex-col space-y-3">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs shrink-0">
                  <div className="bg-pc-black border border-pc-border rounded-xl p-2.5">
                    <span className="text-[10px] text-pc-muted uppercase font-bold block">Matched</span>
                    <span className="text-lg font-black text-white">{previewData.summary.totalMatched}</span>
                    <span className="text-[10px] text-pc-muted block">products</span>
                  </div>
                  <div className="bg-pc-black border border-pc-border rounded-xl p-2.5">
                    <span className="text-[10px] text-pc-muted uppercase font-bold block">Total Units</span>
                    <span className="text-lg font-black text-pc-green">{previewData.summary.totalUnits}</span>
                    <span className="text-[10px] text-pc-muted block">to import</span>
                  </div>
                  <div className="bg-pc-black border border-pc-border rounded-xl p-2.5">
                    <span className="text-[10px] text-pc-muted uppercase font-bold block">Zero / Blank</span>
                    <span className="text-lg font-black text-amber-400">{previewData.summary.zeroCountItems}</span>
                    <span className="text-[10px] text-pc-muted block">count as 0</span>
                  </div>
                  <div className="bg-pc-black border border-pc-border rounded-xl p-2.5">
                    <span className="text-[10px] text-pc-muted uppercase font-bold block">Excluded</span>
                    <span className="text-lg font-black text-purple-400">{previewData.summary.totalSkipped}</span>
                    <span className="text-[10px] text-pc-muted block">wholesale &amp; acc</span>
                  </div>
                  <div className="bg-pc-black border border-pc-border rounded-xl p-2.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-pc-muted uppercase font-bold block">Unmatched</span>
                    <span className="text-lg font-black text-rose-400">{previewData.summary.totalUnmatched}</span>
                    <span className="text-[10px] text-pc-muted block">no exact match</span>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-pc-black p-1 rounded-lg border border-pc-border text-xs overflow-x-auto">
                    <button
                      onClick={() => setPreviewTab('MATCHED')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        previewTab === 'MATCHED' ? 'bg-pc-green text-black' : 'text-pc-muted hover:text-white'
                      }`}
                    >
                      All Matched ({previewData.matched.length})
                    </button>
                    <button
                      onClick={() => setPreviewTab('CHANGES')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        previewTab === 'CHANGES' ? 'bg-pc-green text-black' : 'text-pc-muted hover:text-white'
                      }`}
                    >
                      Changes Only ({previewData.matched.filter(m => m.change !== 0).length})
                    </button>
                    <button
                      onClick={() => setPreviewTab('UNMATCHED')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        previewTab === 'UNMATCHED' ? 'bg-pc-green text-black' : 'text-pc-muted hover:text-white'
                      }`}
                    >
                      Unmatched ({previewData.unmatched.length})
                    </button>
                    <button
                      onClick={() => setPreviewTab('SKIPPED')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        previewTab === 'SKIPPED' ? 'bg-pc-green text-black' : 'text-pc-muted hover:text-white'
                      }`}
                    >
                      Excluded ({previewData.skipped.length})
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={previewSearch}
                    onChange={e => setPreviewSearch(e.target.value)}
                    className="bg-pc-black border border-pc-border rounded-lg px-3 py-1.5 text-white text-xs placeholder-pc-muted focus:outline-none focus:border-pc-green"
                  />
                </div>

                {/* Table View */}
                <div className="flex-1 overflow-y-auto border border-pc-border rounded-xl bg-pc-black/40 pr-1">
                  {(previewTab === 'MATCHED' || previewTab === 'CHANGES') && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-white/5 sticky top-0 border-b border-pc-border text-pc-muted font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Sheet Product Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-center">In Box Now</th>
                          <th className="p-2.5 text-center">Sheet Qty</th>
                          <th className="p-2.5 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pc-border/40 font-mono">
                        {previewData.matched
                          .filter(item => {
                            if (previewTab === 'CHANGES' && item.change === 0) return false;
                            if (!previewSearch) return true;
                            const q = previewSearch.toLowerCase();
                            return item.sheetName.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q);
                          })
                          .map((item, idx) => (
                            <tr key={`${item.productId}-${idx}`} className="hover:bg-white/[0.03] transition-colors">
                              <td className="p-2.5 text-pc-muted text-[11px]">{item.rowNumber}</td>
                              <td className="p-2.5 font-sans font-bold text-white max-w-[240px] truncate" title={item.sheetName}>
                                {item.sheetName}
                              </td>
                              <td className="p-2.5 font-sans">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 uppercase">
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-2.5 text-center text-pc-muted">{item.currentQty}</td>
                              <td className="p-2.5 text-center font-bold text-white">
                                {item.newQty === 0 ? <span className="text-amber-400">0</span> : item.newQty}
                              </td>
                              <td className="p-2.5 text-right">
                                {item.change > 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    +{item.change}
                                  </span>
                                )}
                                {item.change < 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {item.change}
                                  </span>
                                )}
                                {item.change === 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500">
                                    same
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {previewTab === 'UNMATCHED' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-white/5 sticky top-0 border-b border-pc-border text-pc-muted font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Sheet Product Name</th>
                          <th className="p-2.5">Section</th>
                          <th className="p-2.5 text-center">Sheet Qty</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pc-border/40 font-mono">
                        {previewData.unmatched
                          .filter(item => {
                            if (!previewSearch) return true;
                            return item.sheetName.toLowerCase().includes(previewSearch.toLowerCase());
                          })
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.03]">
                              <td className="p-2.5 text-pc-muted text-[11px]">{item.rowNumber}</td>
                              <td className="p-2.5 font-sans font-bold text-white">{item.sheetName}</td>
                              <td className="p-2.5 font-sans text-pc-muted">{item.section}</td>
                              <td className="p-2.5 text-center font-bold text-white">{item.newQty}</td>
                              <td className="p-2.5 text-right font-sans">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  No Exact Match
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {previewTab === 'SKIPPED' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-white/5 sticky top-0 border-b border-pc-border text-pc-muted font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Sheet Row Item</th>
                          <th className="p-2.5">Section</th>
                          <th className="p-2.5 text-right">Exclusion Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pc-border/40 font-mono">
                        {previewData.skipped
                          .filter(item => {
                            if (!previewSearch) return true;
                            return item.sheetName.toLowerCase().includes(previewSearch.toLowerCase());
                          })
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.03]">
                              <td className="p-2.5 text-pc-muted text-[11px]">{item.rowNumber}</td>
                              <td className="p-2.5 font-sans font-semibold text-slate-300">{item.sheetName}</td>
                              <td className="p-2.5 font-sans text-pc-muted">{item.section}</td>
                              <td className="p-2.5 text-right font-sans">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.reason === 'Wholesale'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : item.reason === 'Accessories'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-white/5 text-slate-400'
                                }`}>
                                  {item.reason}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-pc-border flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="text-xs text-pc-muted">
                {previewData ? (
                  <span>
                    Ready to set <strong className="text-white">{previewData.matched.length}</strong> items in{' '}
                    <strong className="text-pc-green">{boxes.find(b => b.id === sheetTargetBoxId)?.name || 'target box'}</strong>.
                  </span>
                ) : (
                  <span>Select box &amp; fetch preview to proceed.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsSheetModalOpen(false);
                    setPreviewData(null);
                  }}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-pc-black border border-pc-border text-white text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                  disabled={sheetApplying}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applySheetImport}
                  disabled={!previewData || previewData.matched.length === 0 || sheetApplying || sheetLoading}
                  className="flex-1 sm:flex-none py-2 px-5 rounded-lg bg-pc-green text-black text-xs font-bold hover:bg-pc-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {sheetApplying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Applying Changes...</span>
                    </>
                  ) : (
                    <span>Apply Import to {boxes.find(b => b.id === sheetTargetBoxId)?.name || 'Box'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
