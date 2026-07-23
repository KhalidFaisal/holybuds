'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = async (q) => {
    setLoading(true);
    setIsOpen(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchResults(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);
  return (
    <div className="relative w-full max-w-lg" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Omni-Search: Products, Orders, Customers..."
          className="w-full bg-pc-dark border border-pc-border rounded-xl pl-10 pr-4 py-2 text-white placeholder-pc-muted focus:outline-none focus:border-pc-green focus:ring-1 focus:ring-pc-green transition-all text-sm"
        />
        <svg className="w-4 h-4 text-pc-muted absolute left-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        {loading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-pc-green border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-pc-dark border border-pc-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[80vh] flex flex-col">
          <div className="overflow-y-auto p-4 space-y-6">
            
            {/* Products (Inventory) */}
            {results.products.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-pc-green uppercase tracking-wider mb-2">Products & Inventory</h3>
                <div className="space-y-1">
                  {results.products.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => { router.push(`/admin/dashboard/products?search=${encodeURIComponent(product.name)}`); setIsOpen(false); }}
                      className="p-2 hover:bg-pc-black rounded-lg cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <span className="text-sm text-white group-hover:text-pc-green transition-colors">{product.name}</span>
                      <span className="text-xs text-pc-muted">Stock: {product.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-pc-green uppercase tracking-wider mb-2">Customers</h3>
                <div className="space-y-1">
                  {results.customers.map(customer => (
                    <div 
                      key={customer.customerPhone} 
                      onClick={() => { router.push(`/admin/dashboard/orders?search=${encodeURIComponent(customer.customerPhone)}`); setIsOpen(false); }}
                      className="p-2 hover:bg-pc-black rounded-lg cursor-pointer flex flex-col group transition-colors"
                    >
                      <span className="text-sm text-white group-hover:text-pc-green transition-colors">{customer.customerName}</span>
                      <span className="text-xs text-pc-muted">{customer.customerPhone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {results.orders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-pc-green uppercase tracking-wider mb-2">Orders</h3>
                <div className="space-y-1">
                  {results.orders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => { router.push(`/admin/dashboard/orders?search=${encodeURIComponent(order.orderNumber)}&expand=${order.id}`); setIsOpen(false); }}
                      className="p-2 hover:bg-pc-black rounded-lg cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-mono group-hover:text-pc-green transition-colors">{order.orderNumber}</span>
                        <span className="text-xs text-pc-muted">{order.customerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">${order.total.toFixed(2)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full block mt-1 ${order.status === 'COMPLETED' ? 'bg-pc-green/20 text-pc-green' : order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.products.length === 0 && results.customers.length === 0 && results.orders.length === 0 && (
              <div className="text-center text-pc-muted text-sm py-4">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
