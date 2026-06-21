'use client';

import { useEffect, useState } from 'react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import CannabisIcon from '@/components/icons/CannabisIcon';

const STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [storeTimezone, setStoreTimezone] = useState('UTC');

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoreTimezone(data.timezone || 'UTC');
      }
    } catch (e) {
      console.error('Error fetching settings for timezone', e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      } else {
        console.error('API error:', data.error);
        setOrders([]);
        if (res.status === 401) {
          window.location.href = '/admin';
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filtered = statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    try {
      return d.toLocaleDateString('en-US', { 
        timeZone: storeTimezone,
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-pc-muted">Loading orders...</div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Orders</h1>
        <p className="text-pc-muted">{orders.length} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((status) => {
          const count = status === 'ALL' ? orders.length : orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-pc-green text-pc-purple'
                  : 'text-pc-muted hover:text-white hover:bg-pc-card border border-pc-border'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-pc-muted">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="glass-card overflow-hidden">
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-pc-card/30 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-bold">{order.orderNumber}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.deliveryMethod === 'DELIVERY' 
                          ? 'bg-pc-purple/20 text-pc-purple border border-pc-purple/30'
                          : 'bg-pc-green/20 text-pc-green border border-pc-green/30'
                      }`}>
                        {order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                      </span>
                    </div>
                    <p className="text-pc-muted text-sm mt-1">{order.customerName} • {formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-white font-bold text-lg">${order.total.toFixed(2)}</span>
                  <svg
                    className={`w-5 h-5 text-pc-muted transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expandedOrder === order.id && (
                <div className="border-t border-pc-border p-4 md:p-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer info */}
                    <div>
                      <h4 className="text-sm font-semibold text-pc-muted uppercase tracking-wider mb-3">Customer Info</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-pc-muted">Name:</span> <span className="text-white">{order.customerName}</span></p>
                        <p><span className="text-pc-muted">Phone:</span> <span className="text-white">{order.customerPhone}</span></p>
                        <p><span className="text-pc-muted">Method:</span> <span className="text-white">{order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span></p>
                        {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                          <p><span className="text-pc-muted">Address:</span> <span className="text-white">{order.deliveryAddress}</span></p>
                        )}
                        {order.notes && <p><span className="text-pc-muted">Notes:</span> <span className="text-white">{order.notes}</span></p>}
                        {order.discountAmount > 0 && (
                          <div className="mt-2 pt-2 border-t border-pc-border/50">
                            <p className="text-pc-green font-semibold">
                              Discount Applied: <span className="text-white">"{order.discountName}" (-${order.discountAmount.toFixed(2)})</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status update */}
                    <div>
                      <h4 className="text-sm font-semibold text-pc-muted uppercase tracking-wider mb-3">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {['PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'].map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              order.status === s
                                ? 'bg-pc-green/20 text-pc-green border border-pc-green/30'
                                : 'text-pc-muted hover:text-white border border-pc-border hover:border-pc-border-light'
                            }`}
                          >
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-pc-muted uppercase tracking-wider mb-3">Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-pc-dark/50 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                              {item.product?.image ? (
                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-pc-dark border border-pc-border flex items-center justify-center shrink-0">
                                  {item.product.category === 'FLOWER' ? (
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
