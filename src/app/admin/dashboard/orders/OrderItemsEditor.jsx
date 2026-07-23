'use client';

import { useState, useEffect } from 'react';
import CannabisIcon from '@/components/icons/CannabisIcon';

export default function OrderItemsEditor({ order, token, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  useEffect(() => {
    if (isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(order.items?.map(i => ({
        productId: i.productId,
        product: i.product,
        quantity: i.quantity,
        price: i.price,
      })) || []);
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, order]);



  const handleQuantityChange = (index, value) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleAddProduct = (product) => {
    const existingIndex = items.findIndex(i => i.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id,
        product: product,
        quantity: 1,
        price: product.price
      }]);
    }
    setSearchQuery('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        onUpdated(data);
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating order');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.isVisible && p.stock > 0
  ).slice(0, 5);

  if (!isEditing) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-pc-muted uppercase tracking-wider">Items</h4>
          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-pc-green hover:text-white transition-colors"
            >
              Edit Items
            </button>
          )}
        </div>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-pc-dark/50 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-pc-dark border border-pc-border flex items-center justify-center shrink-0">
                      {item.product?.category === 'FLOWER' ? (
                        <CannabisIcon className="w-4 h-4 text-pc-green" />
                      ) : (
                        <svg className="w-4 h-4 text-pc-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{item.product?.name || 'Unknown'}</p>
                  <p className="text-pc-muted text-xs">× {item.quantity}</p>
                </div>
              </div>
              <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-pc-border rounded-xl p-4 bg-pc-card/50 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Editing Items</h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            className="text-xs px-3 py-1.5 rounded bg-pc-dark border border-pc-border hover:bg-pc-border text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="text-xs px-3 py-1.5 rounded bg-pc-green/20 border border-pc-green/30 text-pc-green hover:bg-pc-green hover:text-pc-dark font-bold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={item.productId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl bg-pc-dark text-sm border border-pc-border gap-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                {item.product?.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-pc-dark border border-pc-border flex items-center justify-center shrink-0">
                    {item.product?.category === 'FLOWER' ? (
                      <CannabisIcon className="w-4 h-4 text-pc-green" />
                    ) : (
                      <svg className="w-4 h-4 text-pc-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{item.product?.name || 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-pc-muted text-xs">Qty:</span>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="w-16 bg-pc-smoke border border-pc-border rounded px-2 py-0.5 text-white text-xs outline-none focus:border-pc-green"
                  />
                  <span className="text-pc-muted text-xs ml-2">${item.price.toFixed(2)} each</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
              <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              <button 
                onClick={() => handleRemoveItem(index)}
                className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded"
                title="Remove item"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-red-400 text-xs italic py-2">Order must contain at least one item.</p>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center bg-pc-dark border border-pc-border rounded-lg px-3 py-2 focus-within:border-pc-green transition-colors">
          <svg className="w-4 h-4 text-pc-muted mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search products to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-pc-muted"
          />
        </div>
        
        {searchQuery && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-pc-dark border border-pc-border rounded-lg shadow-xl overflow-hidden">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  className="w-full text-left px-4 py-3 hover:bg-pc-card transition-colors flex justify-between items-center border-b border-pc-border last:border-0"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{p.name}</p>
                    <p className="text-pc-muted text-xs">{p.stock} in stock</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-pc-green text-sm font-semibold">${p.price.toFixed(2)}</span>
                    <span className="text-xs bg-pc-green/20 text-pc-green px-2 py-1 rounded">Add</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-pc-muted text-center">
                No products found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
