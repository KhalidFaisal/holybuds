'use client';

const STAGES = [
  { key: 'PENDING', label: 'Order Received', desc: 'Sent to dispensary' },
  { key: 'PROCESSING', label: 'Preparing', desc: 'Packing your items' },
  { key: 'READY', label: 'Out for Delivery', desc: 'Driver on the way' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your buds!' },
];

function getStageIndex(status) {
  if (status === 'PENDING') return 0;
  if (status === 'PROCESSING') return 1;
  if (status === 'READY') return 2;
  if (status === 'DELIVERED' || status === 'COMPLETED') return 3;
  return 0;
}

export default function ActiveOrderTracker({ orders = [], onSelectOrder }) {
  const activeOrders = orders.filter(o => 
    ['PENDING', 'PROCESSING', 'READY', 'DELIVERED'].includes(o.status)
  );

  if (activeOrders.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {activeOrders.map(order => {
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
                    {isDelivery ? 'Delivery in Progress' : 'Pickup in Progress'} • Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">
                  ${order.total.toFixed(2)}
                </span>
                {onSelectOrder && (
                  <button 
                    onClick={() => onSelectOrder(order)}
                    className="btn-secondary py-1.5 px-3 text-xs font-bold"
                  >
                    View Receipt
                  </button>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isPending = idx > currentIdx;

                  return (
                    <div key={stage.key} className="flex flex-col items-center text-center relative z-10">
                      {/* Step Circle */}
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all shadow-md ${
                          isCurrent 
                            ? 'bg-pc-green text-pc-black ring-4 ring-pc-green/30 scale-110 font-black' 
                            : isCompleted 
                              ? 'bg-pc-green/20 text-pc-green border border-pc-green/50' 
                              : 'bg-pc-dark text-pc-muted border border-pc-border'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <p className={`text-xs md:text-sm font-bold ${isCurrent ? 'text-pc-green' : isCompleted ? 'text-white' : 'text-pc-muted'}`}>
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-pc-muted/70 hidden sm:block mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar line for desktop */}
              <div className="hidden md:block relative -mt-14 mb-10 mx-12 h-1 bg-pc-dark -z-0">
                <div 
                  className="h-full bg-pc-green transition-all duration-500 rounded-full"
                  style={{ width: `${(currentIdx / (STAGES.length - 1)) * 100}%` }}
                />
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
    </div>
  );
}
