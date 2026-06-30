'use client';

import { useEffect, useState } from 'react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import CannabisIcon from '@/components/icons/CannabisIcon';
import CustomerFlags from '@/components/CustomerFlags';
import OrderItemsEditor from './OrderItemsEditor';

const STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const ITEMS_PER_PAGE = 20;

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

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setSelectedOrders(prev => prev.filter(id => id !== orderId));
        if (expandedOrder === orderId) setExpandedOrder(null);
      }
    } catch (e) {
      console.error('Error deleting order', e);
    }
  };

  const deleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) return;
    
    // Process sequentially to not overload DB/API
    for (const id of selectedOrders) {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setOrders(prev => prev.filter(o => o.id !== id));
        }
      } catch (e) {
        console.error(`Error deleting order ${id}`, e);
      }
    }
    setSelectedOrders([]);
    setExpandedOrder(null);
  };

  const updateSelectedOrdersStatus = async (newStatus) => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Are you sure you want to mark ${selectedOrders.length} orders as ${newStatus}?`)) return;
    
    // Process sequentially to not overload DB/API and ensure webhooks trigger correctly
    for (const id of selectedOrders) {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (res.ok) {
          const updated = await res.json();
          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        }
      } catch (e) {
        console.error(`Error updating order ${id}`, e);
      }
    }
    setSelectedOrders([]);
  };

  const copyOrderDetails = async (order) => {
    let text = `Order #${order.orderNumber}\n`;
    text += `Name: ${order.customerName}\n`;
    text += `Method: ${order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}\n`;
    if (order.deliveryMethod === 'DELIVERY' && order.deliveryAddress) {
      text += `Address: ${order.deliveryAddress}\n`;
    } else if (order.deliveryMethod === 'PICKUP' && order.deliveryAddress) {
      text += `Town: ${order.deliveryAddress}\n`;
    }
    if (order.notes) {
      text += `Notes: ${order.notes}\n`;
    }
    text += `\nItems:\n`;
    order.items?.forEach(item => {
      text += `- ${item.product?.name || 'Unknown'} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const expectedTotal = itemsSubtotal - (order.discountAmount || 0);
    const fee = Math.round((order.total - expectedTotal) * 100) / 100;

    if (order.discountAmount > 0) {
      text += `Discount: -$${order.discountAmount.toFixed(2)}\n`;
    }
    if (fee > 0) {
      text += `Delivery Fee: $${fee.toFixed(2)}\n`;
    }
    text += `Total: $${order.total.toFixed(2)}\n`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    
    if (startDate || endDate) {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: storeTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const parts = formatter.formatToParts(new Date(o.createdAt));
        let y, m, d;
        for (const p of parts) {
          if (p.type === 'year') y = p.value;
          if (p.type === 'month') m = p.value;
          if (p.type === 'day') d = p.value;
        }
        const orderDateStr = `${y}-${m}-${d}`;
        
        if (startDate && orderDateStr < startDate) return false;
        if (endDate && orderDateStr > endDate) return false;
      } catch (e) {
        console.error("Timezone formatting error", e);
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(filtered.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleSelectOrder = (e, orderId) => {
    e.stopPropagation();
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    } else {
      setSelectedOrders(prev => [...prev, orderId]);
    }
  };

  const exportSelectedOrders = () => {
    if (selectedOrders.length === 0) return;
    
    const rows = [
      ['Item name(s)', 'Quantity', 'Price', 'Customer Name']
    ];

    const selectedOrderData = orders.filter(o => selectedOrders.includes(o.id));

    selectedOrderData.forEach(order => {
      const customerName = order.customerName || '';

      if (order.items && order.items.length > 0) {
        let remainingTotal = order.total;
        const subtotal = order.total + (order.discountAmount || 0);

        order.items.forEach((item, index) => {
          const itemName = item.product?.name || 'Unknown';
          const quantity = item.quantity;
          
          let lineTotal;
          if (index === order.items.length - 1) {
            // Assign remaining total to last item to fix rounding errors
            lineTotal = remainingTotal;
          } else {
            const itemOriginalTotal = item.price * item.quantity;
            if (subtotal <= 0) {
              lineTotal = 0;
            } else {
              lineTotal = Math.round(((itemOriginalTotal / subtotal) * order.total) * 100) / 100;
            }
            remainingTotal -= lineTotal;
          }
          
          rows.push([
            `"${itemName.replace(/"/g, '""')}"`,
            quantity,
            `"${lineTotal.toFixed(2)}"`,
            `"${customerName.replace(/"/g, '""')}"`
          ]);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Orders</h1>
          <p className="text-pc-muted">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    updateSelectedOrdersStatus(e.target.value);
                    e.target.value = ''; // reset selection
                  }
                }}
                className="px-4 py-2 bg-pc-card border border-pc-border rounded-xl font-bold text-white transition-colors text-sm focus:outline-none cursor-pointer"
              >
                <option value="">Update Status...</option>
                {STATUSES.filter(s => s !== 'ALL').map(status => (
                  <option key={status} value={status}>
                    Mark as {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <button 
                onClick={deleteSelectedOrders}
                className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors text-sm"
              >
                Delete Selected ({selectedOrders.length})
              </button>
              <button 
                onClick={exportSelectedOrders}
                className="px-4 py-2 bg-pc-green text-black rounded-xl font-bold hover:bg-pc-green/90 transition-colors text-sm"
              >
                Export Selected ({selectedOrders.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => {
            const count = status === 'ALL' ? orders.length : orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-pc-green text-black'
                    : 'text-pc-muted hover:text-white hover:bg-pc-card border border-pc-border'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-pc-card border border-pc-border rounded-lg px-3 py-1">
            <span className="text-xs text-pc-muted font-semibold uppercase mr-2">From</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none focus:ring-0 outline-none"
            />
          </div>
          <div className="flex items-center bg-pc-card border border-pc-border rounded-lg px-3 py-1">
            <span className="text-xs text-pc-muted font-semibold uppercase mr-2">To</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none focus:ring-0 outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-pc-muted hover:text-white transition-colors"
              title="Clear dates"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {filtered.length > 0 && (
        <div className="mb-4 flex items-center">
          <label className="flex items-center gap-3 text-sm text-pc-muted cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              className="modern-checkbox"
              checked={selectedOrders.length > 0 && selectedOrders.length === filtered.length}
              onChange={handleSelectAll}
            />
            <span className="font-medium">Select All</span>
          </label>
        </div>
      )}

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-pc-muted">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="glass-card overflow-hidden">
              {/* Order Header */}
              <div className="flex w-full hover:bg-pc-card/30 transition-colors">
                <div className="pl-4 md:pl-6 pt-5 md:pt-7 flex-shrink-0" onClick={(e) => toggleSelectOrder(e, order.id)}>
                  <input 
                    type="checkbox" 
                    className="modern-checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => toggleSelectOrder(e, order.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="flex-1 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-bold">{order.orderNumber}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.deliveryMethod === 'DELIVERY' 
                          ? 'bg-pc-gold/20 text-pc-gold border border-pc-gold/30'
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
              </div>

              {/* Expanded details */}
              {expandedOrder === order.id && (
                <div className="border-t border-pc-border p-4 md:p-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer info */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-pc-muted uppercase tracking-wider">Customer Info</h4>
                        <button 
                          onClick={() => copyOrderDetails(order)}
                          className="flex items-center gap-1 text-xs text-pc-muted hover:text-white transition-colors"
                        >
                          {copiedOrderId === order.id ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              <span className="text-pc-green">Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                              Copy Details
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p><span className="text-pc-muted">Name:</span> <span className="text-white">{order.customerName}</span></p>
                          <p><span className="text-pc-muted">Phone:</span> <span className="text-white">{order.customerPhone}</span></p>
                          <CustomerFlags phone={order.customerPhone} />
                        </div>
                        <p><span className="text-pc-muted">Method:</span> <span className="text-white">{order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span></p>
                        {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                          <p><span className="text-pc-muted">Address:</span> <span className="text-white">{order.deliveryAddress}</span></p>
                        )}
                        {order.notes && <p><span className="text-pc-muted">Notes:</span> <span className="text-white">{order.notes}</span></p>}
                        {(() => {
                          const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                          const expectedTotal = itemsSubtotal - (order.discountAmount || 0);
                          const fee = Math.round((order.total - expectedTotal) * 100) / 100;
                          if (fee > 0) {
                            return (
                              <p><span className="text-pc-muted">Delivery Fee:</span> <span className="text-white">${fee.toFixed(2)}</span></p>
                            );
                          }
                          return null;
                        })()}
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
                      
                      <div className="mt-4 pt-4 border-t border-pc-border/50">
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Delete Order
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order items editor */}
                  <OrderItemsEditor 
                    order={order} 
                    token={token} 
                    onUpdated={(updated) => {
                      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 glass-card p-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-pc-dark border border-pc-border text-white rounded-lg disabled:opacity-50 hover:bg-pc-border transition-colors font-medium text-sm"
          >
            Previous
          </button>
          <span className="text-pc-muted text-sm font-medium">
            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-pc-dark border border-pc-border text-white rounded-lg disabled:opacity-50 hover:bg-pc-border transition-colors font-medium text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
