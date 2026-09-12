'use client';

import { useState } from 'react';
import Link from 'next/link';

const STATUS_CONFIG = {
  PENDING: { label: 'Order Received', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  PROCESSING: { label: 'Preparing', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  READY: { label: 'Out for Delivery', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  DELIVERED: { label: 'Delivered', badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export default function OrdersTab({ orders = [], onReorder }) {
  const [filter, setFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const activeCount = orders.filter(o => ['PENDING', 'PROCESSING', 'READY', 'DELIVERED'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['PENDING', 'PROCESSING', 'READY', 'DELIVERED'].includes(order.status);
    if (filter === 'COMPLETED') return order.status === 'COMPLETED';
    if (filter === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  const handleReorderClick = (order) => {
    setReorderingId(order.id);
    if (onReorder) {
      onReorder(order);
    }
    setTimeout(() => setReorderingId(null), 1000);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
              : 'bg-pc-dark/70 text-pc-muted hover:text-white border border-pc-border'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'ACTIVE'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-pc-dark/70 text-pc-muted hover:text-white border border-pc-border'
          }`}
        >
          {activeCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'COMPLETED'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-pc-dark/70 text-pc-muted hover:text-white border border-pc-border'
          }`}
        >
          Completed ({completedCount})
        </button>
        {cancelledCount > 0 && (
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'CANCELLED'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-pc-dark/70 text-pc-muted hover:text-white border border-pc-border'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-pc-dark/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pc-border">
            <svg className="w-8 h-8 text-pc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
          <p className="text-sm text-pc-muted mb-6">
            {filter === 'ACTIVE' 
              ? 'You do not have any orders currently in transit.' 
              : 'Browse our fresh menu and enjoy fast delivery.'}
          </p>
          <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
            Browse Menu
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, badgeClass: 'bg-pc-dark text-pc-muted border-pc-border' };
            const itemsSubtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const rawDeliveryFee = order.total + (order.discountAmount || 0) - itemsSubtotal;
            const deliveryFee = rawDeliveryFee > 0 ? Math.round(rawDeliveryFee * 100) / 100 : 0;

            return (
              <div 
                key={order.id} 
                className={`glass-card transition-all overflow-hidden border ${
                  isExpanded ? 'border-pc-green/40 shadow-xl' : 'border-pc-border hover:border-pc-border/80'
                }`}
              >
                {/* Order Summary Bar */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <span className="text-white font-black text-lg">
                          Order #{order.orderNumber}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.badgeClass}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-xs bg-pc-dark/70 text-pc-muted px-2 py-0.5 rounded-md border border-pc-border flex items-center gap-1">
                          {order.deliveryMethod === 'DELIVERY' ? (
                            <>
                              <svg className="w-3 h-3 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 3.75h4.5m-4.5 0H9.75M9.75 3.75v3.75m0 0H4.5" />
                              </svg>
                              <span>Delivery</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.651h.008v.008H6.75v-.008Zm0-4.5h.008v.008H6.75v-.008Zm0-4.5h.008v.008H6.75v-.008Z" />
                              </svg>
                              <span>Pickup</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-pc-muted">
                        Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <p className="text-xs text-pc-muted">Total</p>
                        <p className="text-2xl font-black text-white">${order.total.toFixed(2)}</p>
                      </div>

                      <button 
                        onClick={() => handleReorderClick(order)}
                        disabled={reorderingId === order.id}
                        className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        {reorderingId === order.id ? 'Adding...' : 'Buy Again'}
                      </button>

                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-2 bg-pc-dark/60 hover:bg-pc-dark text-pc-muted hover:text-white rounded-xl border border-pc-border transition-colors"
                        title={isExpanded ? 'Collapse' : 'View Details'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Items Preview Grid (Compact) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-pc-border/40">
                    {order.items?.slice(0, isExpanded ? undefined : 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-pc-dark/40 p-2.5 rounded-xl border border-pc-border/40">
                        <div className="w-12 h-12 bg-pc-smoke rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {item.product?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-pc-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                          )}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-white text-xs truncate">{item.product?.name || 'Item'}</p>
                          <p className="text-[11px] text-pc-muted">Qty: {item.quantity} • ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}

                    {!isExpanded && (order.items?.length || 0) > 3 && (
                      <button 
                        onClick={() => setExpandedOrderId(order.id)}
                        className="flex items-center justify-center gap-1.5 text-xs text-pc-green font-bold bg-pc-green/5 hover:bg-pc-green/10 border border-pc-green/20 rounded-xl p-2.5 transition-colors"
                      >
                        +{(order.items?.length || 0) - 3} more items
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Full Receipt Breakdown */}
                {isExpanded && (
                  <div className="bg-pc-dark/80 p-6 border-t border-pc-border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Shipping / Destination */}
                      <div>
                        <h4 className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-2">Delivery Information</h4>
                        <div className="bg-pc-card p-4 rounded-xl border border-pc-border/60 text-xs space-y-1.5">
                          <p className="text-white font-medium">Method: <span className="text-pc-green">{order.deliveryMethod}</span></p>
                          {order.deliveryAddress && (
                            <p className="text-pc-muted">Destination: <span className="text-white">{order.deliveryAddress}</span></p>
                          )}
                          {order.notes && (
                            <p className="text-pc-muted">Instructions: <span className="text-amber-300 italic">{order.notes}</span></p>
                          )}
                        </div>
                      </div>

                      {/* Right: Payment & Breakdown */}
                      <div>
                        <h4 className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-2">Receipt Breakdown</h4>
                        <div className="bg-pc-card p-4 rounded-xl border border-pc-border/60 text-xs space-y-2">
                          <div className="flex justify-between text-pc-muted">
                            <span>Subtotal</span>
                            <span className="text-white font-mono">${itemsSubtotal.toFixed(2)}</span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-pc-green">
                              <span>Discount {order.discountName ? `(${order.discountName})` : ''}</span>
                              <span className="font-mono">-${order.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-pc-muted">
                              <span>Delivery Fee</span>
                              <span className="text-white font-mono">${deliveryFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-pc-border/60 text-white">
                            <span>Grand Total</span>
                            <span className="font-mono text-pc-green">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
