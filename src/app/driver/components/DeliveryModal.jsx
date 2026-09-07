'use client';

import { useState, useEffect } from 'react';

export default function DeliveryModal({ order, driver, onClose, onSubmit }) {
  const [isSwapping, setIsSwapping] = useState(false);
  const [items, setItems] = useState([]);
  
  const [paidCash, setPaidCash] = useState('');
  const [paidZelle, setPaidZelle] = useState('');
  const [amountOwed, setAmountOwed] = useState(0);
  const [newTotal, setNewTotal] = useState(order.total);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(order.items.map(i => ({
      productId: i.productId,
      name: i.product.name,
      price: i.price,
      quantity: i.quantity
    })));
  }, [order]);

  // Recalculate total
  useEffect(() => {
    if (isSwapping) {
      let subtotal = 0;
      items.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      const finalT = Math.max(0, subtotal - (order.discountAmount || 0));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewTotal(finalT);
    } else {
      setNewTotal(order.total);
    }
  }, [items, isSwapping, order.discountAmount, order.total]);

  // Recalculate Owed
  useEffect(() => {
    const cash = parseFloat(paidCash) || 0;
    const zelle = parseFloat(paidZelle) || 0;
    const owed = Math.max(0, newTotal - cash - zelle);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmountOwed(owed);
  }, [newTotal, paidCash, paidZelle]);

  const handleRemoveItem = (idx) => {
    const newItems = [...items];
    if (newItems[idx].quantity > 1) {
      newItems[idx].quantity -= 1;
    } else {
      newItems.splice(idx, 1);
    }
    setItems(newItems);
  };

  const handleAddItem = (boxItem) => {
    const newItems = [...items];
    const existingIdx = newItems.findIndex(i => i.productId === boxItem.productId);
    
    if (existingIdx >= 0) {
      newItems[existingIdx].quantity += 1;
    } else {
      newItems.push({
        productId: boxItem.productId,
        name: boxItem.product.name,
        price: boxItem.product.price || 0, // Fallback if missing
        quantity: 1
      });
    }
    setItems(newItems);
  };

  const handleSubmit = () => {
    onSubmit({
      updatedItems: isSwapping ? items : undefined,
      newTotal,
      paidCash: parseFloat(paidCash) || 0,
      paidZelle: parseFloat(paidZelle) || 0,
      amountOwed
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-pc-muted hover:text-white">✕</button>
        
        <h2 className="text-2xl font-bold text-white mb-2">Complete Delivery</h2>
        <p className="text-pc-muted mb-6">Order {order.orderNumber} • {order.customerName}</p>

        <div className="bg-pc-black rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-white">Order Total</span>
            <span className="text-2xl font-bold text-pc-green">${newTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-pc-muted block mb-1">Cash Collected ($)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                value={paidCash} 
                onChange={e => setPaidCash(e.target.value)}
                placeholder="0.00"
                className="w-full bg-pc-dark border border-pc-border rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:border-pc-green"
              />
            </div>
            <div>
              <label className="text-sm text-pc-muted block mb-1">Zelle Collected ($)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                value={paidZelle} 
                onChange={e => setPaidZelle(e.target.value)}
                placeholder="0.00"
                className="w-full bg-pc-dark border border-pc-border rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:border-pc-green"
              />
            </div>
            <div className="pt-2 border-t border-pc-border flex justify-between items-center">
              <span className="text-sm text-red-400 font-bold">Amount Owed ($)</span>
              <span className="text-lg font-bold text-red-400">${amountOwed.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 text-white font-bold cursor-pointer mb-4">
            <input 
              type="checkbox" 
              checked={isSwapping} 
              onChange={e => setIsSwapping(e.target.checked)} 
              className="w-5 h-5 accent-pc-green"
            />
            Edit / Swap Items
          </label>

          {isSwapping && (
            <div className="space-y-4">
              <div className="bg-pc-black p-3 rounded-lg border border-pc-border">
                <h4 className="text-xs uppercase text-pc-muted font-bold mb-2">Current Order Items</h4>
                {items.length === 0 ? <p className="text-sm text-pc-muted italic">No items</p> : items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-2 last:mb-0">
                    <span className="text-sm text-white">{item.quantity}x {item.name}</span>
                    <button onClick={() => handleRemoveItem(idx)} className="w-6 h-6 rounded bg-red-500/20 text-red-500 hover:bg-red-500/40 flex items-center justify-center font-bold text-lg">-</button>
                  </div>
                ))}
              </div>

              <div className="bg-pc-black p-3 rounded-lg border border-pc-border">
                <h4 className="text-xs uppercase text-pc-muted font-bold mb-2">Add from your box</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {driver.currentBox?.items?.filter(bi => bi.expectedQuantity > 0).length > 0 ? (
                    driver.currentBox.items.filter(bi => bi.expectedQuantity > 0).map(bi => (
                      <div key={bi.id} className="flex justify-between items-center bg-pc-dark p-2 rounded">
                        <div className="flex flex-col">
                          <span className="text-sm text-white">{bi.product.name}</span>
                          <span className="text-xs text-pc-muted">Available: {bi.expectedQuantity}</span>
                        </div>
                        <button onClick={() => handleAddItem(bi)} className="w-6 h-6 rounded bg-pc-green/20 text-pc-green hover:bg-pc-green/40 flex items-center justify-center font-bold text-lg">+</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-pc-muted italic">Your box is empty.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full btn-primary py-3 font-bold text-lg"
        >
          Confirm & Deliver
        </button>
      </div>
    </div>
  );
}
