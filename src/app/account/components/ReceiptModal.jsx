'use client';

import { useEffect } from 'react';

function getStatusBadge(status, isDelivery) {
  const s = (status || '').toUpperCase();
  if (s === 'CANCELLED') {
    return { label: 'Cancelled', className: 'bg-red-500/20 text-red-600 border-red-500/40' };
  }
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return { label: isDelivery ? 'Delivered' : 'Completed', className: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40' };
  }
  if (s === 'PROCESSING' || s === 'READY') {
    return { label: isDelivery ? 'Out for Delivery' : 'Ready for Pickup', className: 'bg-blue-500/20 text-blue-700 border-blue-500/40' };
  }
  return { label: 'Pending', className: 'bg-amber-500/20 text-amber-700 border-amber-500/40' };
}

export default function ReceiptModal({ order, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const isDelivery = order.deliveryMethod === 'DELIVERY';
  const statusInfo = getStatusBadge(order.status, isDelivery);
  const itemsSubtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const rawDeliveryFee = (order.total || 0) + (order.discountAmount || 0) - itemsSubtotal;
  const deliveryFee = rawDeliveryFee > 0 ? Math.round(rawDeliveryFee * 100) / 100 : 0;

  const formattedDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pc-green/10 border border-pc-green/30 flex items-center justify-center text-pc-green">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900">Order Receipt</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">#{order.orderNumber} • {formattedDate}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
          {/* Delivery & Customer Info */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Fulfillment</span>
              <span className="font-bold text-gray-900 flex items-center gap-1">
                {isDelivery ? 'Delivery' : 'Store Pickup'}
              </span>
            </div>
            {order.deliveryAddress && (
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium shrink-0">Destination</span>
                <span className="font-semibold text-gray-900 text-right">{order.deliveryAddress}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium">Contact Phone</span>
                <span className="font-mono text-gray-900">{order.customerPhone}</span>
              </div>
            )}
            {order.notes && (
              <div className="pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium">Order Notes: </span>
                <span className="text-amber-800 italic">{order.notes}</span>
              </div>
            )}
          </div>

          {/* Items Purchased */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Purchased Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-2.5">
              {(order.items || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50/70 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.product?.name || 'Item'}</p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-900 shrink-0">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">${itemsSubtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-pc-green font-medium">
                <span>Discount {order.discountName ? `(${order.discountName})` : ''}</span>
                <span className="font-mono">-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-mono">${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black pt-3 border-t border-gray-200 text-gray-900">
              <span>Grand Total</span>
              <span className="font-mono text-pc-green text-lg">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-pure-white bg-pc-green hover:opacity-90 rounded-xl transition-all shadow-md shadow-pc-green/20"
            style={{ color: '#ffffff' }}
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
