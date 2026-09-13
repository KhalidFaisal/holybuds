'use client';

import { useState } from 'react';
import ReceiptModal from './ReceiptModal';

function getStages(order) {
  const isDelivery = order.deliveryMethod === 'DELIVERY';
  return [
    { key: 'PENDING', label: 'Pending', desc: 'Order received' },
    { 
      key: 'PROCESSING', 
      label: isDelivery ? 'Out for Delivery' : 'Ready for Pickup', 
      desc: isDelivery ? 'Driver on the way' : 'Ready at store' 
    },
    { 
      key: 'DELIVERED', 
      label: isDelivery ? 'Delivered' : 'Completed', 
      desc: isDelivery ? 'Order delivered' : 'Order completed' 
    },
  ];
}

function getStageIndex(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 0;
  if (s === 'PROCESSING' || s === 'READY') return 1;
  if (s === 'DELIVERED' || s === 'COMPLETED') return 2;
  return 0;
}

export default function ActiveOrderTracker({ orders = [], onSelectOrder, onClose }) {
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);

  const activeOrders = orders.filter(o => 
    (o.status || '').toUpperCase() !== 'DELETED' &&
    ['PENDING', 'PROCESSING', 'READY'].includes((o.status || '').toUpperCase())
  );

  if (activeOrders.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {activeOrders.map(order => {
        const stages = getStages(order);
        const currentIdx = getStageIndex(order.status);
        const isDelivery = order.deliveryMethod === 'DELIVERY';

        return (
          <div 
            key={order.id} 
            className="glass-card p-6 md:p-8 border-pc-green/40 bg-gradient-to-br from-pc-card via-pc-card to-pc-green/5 relative overflow-hidden shadow-xl shadow-pc-green/5"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-pc-border/60">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pc-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pc-green"></span>
                </span>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Live Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-pc-muted">
                    {isDelivery 
                      ? (currentIdx === 1 ? 'Out for Delivery' : 'Delivery in Progress') 
                      : (currentIdx === 1 ? 'Ready for Pickup' : 'Pickup in Progress')} • Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">
                  ${order.total.toFixed(2)}
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    setReceiptModalOrder(order);
                    onSelectOrder?.(order);
                  }}
                  className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                  View Receipt
                </button>
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="p-1.5 text-pc-muted hover:text-white bg-pc-dark/70 hover:bg-pc-dark rounded-xl border border-pc-border transition-colors"
                    title="Hide Tracker"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="py-2 relative">
              {/* Connecting progress line placed BEHIND circles */}
              <div className="absolute top-7 -translate-y-1/2 left-[16.67%] right-[16.67%] h-1 bg-pc-dark rounded-full overflow-hidden z-0">
                <div 
                  className="h-full bg-pc-green transition-all duration-500 rounded-full"
                  style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                {stages.map((stage, idx) => {
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage.key} className="flex flex-col items-center text-center relative z-10">
                      {/* Step Circle with green border */}
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all shadow-md relative z-20 ${
                          isCurrent 
                            ? 'bg-pc-green text-pure-white border-2 border-pc-green ring-4 ring-pc-green/30 scale-110 font-black' 
                            : isCompleted 
                              ? 'bg-white text-pc-green border-2 border-pc-green shadow-md shadow-pc-green/15' 
                              : 'bg-pc-card text-pc-muted border-2 border-pc-border/80'
                        }`}
                        style={isCurrent ? { color: '#ffffff' } : undefined}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span 
                            className={isCurrent ? 'text-pure-white font-black' : 'text-gray-500 font-bold'}
                            style={isCurrent ? { color: '#ffffff' } : undefined}
                          >
                            {idx + 1}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs md:text-sm font-bold ${isCurrent ? 'text-pc-green' : isCompleted ? 'text-gray-900 font-bold' : 'text-pc-muted'}`}>
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-pc-muted/70 hidden sm:block mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Destination / Delivery notes */}
            {isDelivery && order.deliveryAddress && (
              <div className="mt-4 pt-4 border-t border-pc-border/40 flex items-center justify-between text-xs text-pc-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  Delivering to: <strong className="text-white font-medium">{order.deliveryAddress}</strong>
                </span>
                <span className="text-[11px] text-pc-muted/70">
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {receiptModalOrder && (
        <ReceiptModal 
          order={receiptModalOrder} 
          onClose={() => setReceiptModalOrder(null)} 
        />
      )}
    </div>
  );
}
