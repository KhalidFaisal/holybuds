'use client';

import { useState, useEffect } from 'react';
import DeliveryModal from './DeliveryModal';

export default function OrdersTab({ driver, refreshDriver }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('AVAILABLE'); // AVAILABLE or MY_ORDERS
  const [deliveringOrder, setDeliveringOrder] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedAddressId, setCopiedAddressId] = useState(null);

  const copyAddress = async (orderId, address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddressId(orderId);
      setTimeout(() => setCopiedAddressId(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/driver/orders?filter=${filter}`, {
          headers: { 'Authorization': `Bearer ${driver.id}` }
        });
        const data = await res.json();
        if (!ignore && res.ok) {
          setOrders(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setLoading(false);
      }
    };

    fetchOrders();

    return () => { ignore = true; };
  }, [filter, driver.id, refreshKey]);

  const handleAction = async (orderId, action, extraData = {}) => {
    try {
      const res = await fetch('/api/driver/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${driver.id}`
        },
        body: JSON.stringify({ orderId, action, ...extraData })
      });
      const data = await res.json();
      if (res.ok) {
        setLoading(true);
        setDeliveringOrder(null);
        setRefreshKey(prev => prev + 1);
        if (typeof refreshDriver === 'function') {
          refreshDriver();
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error updating order');
    }
  };

  const handleCompleteDelivery = (extraData) => {
    if (!deliveringOrder) return;
    handleAction(deliveringOrder.id, 'DELIVER', extraData);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex gap-4 border-b border-pc-border pb-4">
        <button 
          onClick={() => {
            setLoading(true);
            setFilter('AVAILABLE');
          }}
          className={`font-bold ${filter === 'AVAILABLE' ? 'text-pc-green' : 'text-pc-muted hover:text-white'}`}
        >
          Available Orders
        </button>
        <button 
          onClick={() => {
            setLoading(true);
            setFilter('MY_ORDERS');
          }}
          className={`font-bold ${filter === 'MY_ORDERS' ? 'text-pc-green' : 'text-pc-muted hover:text-white'}`}
        >
          My Orders
        </button>
      </div>

      {loading ? (
        <div className="text-pc-muted animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-pc-muted">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-pc-dark border border-pc-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{order.orderNumber}</h3>
                  <p className="text-sm text-pc-muted">{order.customerName}</p>
                  {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-pc-muted">
                        <span className="shrink-0">📍</span>
                        <span className="text-white font-medium break-words flex-1">{order.deliveryAddress}</span>
                        <button
                          type="button"
                          onClick={() => copyAddress(order.id, order.deliveryAddress)}
                          className="text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-pc-muted hover:text-white transition-colors shrink-0 flex items-center gap-1"
                          title="Copy address"
                        >
                          {copiedAddressId === order.id ? (
                            <span className="text-pc-green font-bold">✓ Copied</span>
                          ) : (
                            <span>📋 Copy</span>
                          )}
                        </button>
                      </div>

                      {filter === 'MY_ORDERS' && (
                        <div className="flex gap-2 pt-1">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-lg transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                            </svg>
                            <span>Google Maps</span>
                          </a>
                          <a
                            href={`https://maps.apple.com/?daddr=${encodeURIComponent(order.deliveryAddress)}&dirflg=d`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm3.93 6.07-2.36 6.29a.5.5 0 0 1-.28.28l-6.29 2.36a.5.5 0 0 1-.61-.61l2.36-6.29a.5.5 0 0 1 .28-.28l6.29-2.36a.5.5 0 0 1 .61.61zM12 11a1 1 0 1 0 1 1 1 1 0 0 0-1-1z" />
                            </svg>
                            <span>Apple Maps</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-pc-green">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-pc-muted uppercase font-bold">{order.deliveryMethod}</p>
                </div>
              </div>

              <div className="bg-pc-black rounded-lg p-3 mb-4 space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-white">
                    <span>{item.quantity}x {item.product.name}</span>
                  </div>
                ))}
              </div>

              {filter === 'AVAILABLE' ? (
                <button 
                  onClick={() => handleAction(order.id, 'CLAIM')}
                  className="w-full btn-primary py-2 font-bold"
                >
                  Claim Order
                </button>
              ) : (
                (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') && (
                  <button 
                    onClick={() => setDeliveringOrder(order)}
                    className="w-full bg-pc-green text-black rounded-lg py-2 font-bold hover:bg-pc-green/90"
                  >
                    Mark as Delivered
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {deliveringOrder && (
        <DeliveryModal 
          order={deliveringOrder} 
          driver={driver} 
          onClose={() => setDeliveringOrder(null)} 
          onSubmit={handleCompleteDelivery} 
        />
      )}
    </div>
  );
}
