'use client';

import { useState, useEffect } from 'react';
import DeliveryModal from './DeliveryModal';

export default function OrdersTab({ driver, refreshDriver }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('AVAILABLE'); // AVAILABLE or MY_ORDERS
  const [deliveringOrder, setDeliveringOrder] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

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
                  {order.deliveryMethod === 'DELIVERY' && (
                    <p className="text-sm text-pc-muted mt-1">📍 {order.deliveryAddress}</p>
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
