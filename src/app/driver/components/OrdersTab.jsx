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
                      <div className="flex items-start gap-1.5 text-sm text-pc-muted">
                        <svg className="w-4 h-4 text-pc-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="text-white font-medium break-words flex-1">{order.deliveryAddress}</span>
                      </div>

                      {filter === 'MY_ORDERS' && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => copyAddress(order.id, order.deliveryAddress)}
                            className="h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-pc-border text-pc-muted hover:text-white transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                            title="Copy address"
                            aria-label="Copy address"
                          >
                            {copiedAddressId === order.id ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="text-pc-green font-bold text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
                                </svg>
                                <span className="text-[11px] font-medium">Copy</span>
                              </>
                            )}
                          </button>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-pc-border hover:border-blue-500/40 flex items-center justify-center transition-colors shadow-sm"
                            title="Open in Google Maps"
                            aria-label="Open in Google Maps"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335" />
                              <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
                            </svg>
                          </a>

                          <a
                            href={`https://maps.apple.com/?daddr=${encodeURIComponent(order.deliveryAddress)}&dirflg=d`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/15 border border-pc-border hover:border-white/30 text-white flex items-center justify-center transition-colors shadow-sm"
                            title="Open in Apple Maps"
                            aria-label="Open in Apple Maps"
                          >
                            <svg className="w-4 h-4 text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.7-0.93 2.73 1 .08 2.01-.48 2.63-1.23z" />
                            </svg>
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
