'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const renderProductList = (title, products, emptyText = "No sales data yet.") => (
    <div className="glass-card p-6 h-full">
      <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
      {!products || products.length === 0 ? (
        <p className="text-pc-muted">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-pc-black rounded-xl border border-pc-border">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-pc-dark flex items-center justify-center font-bold text-pc-muted border border-pc-border">
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-bold">{product.name}</p>
                  <p className="text-xs text-pc-muted">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{product.quantity} sold</p>
                <p className="text-sm text-pc-green">${product.revenue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load analytics');
        
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-pc-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card p-12 text-center text-red-400">
        <p>{error || 'Failed to load data'}</p>
      </div>
    );
  }

  const chartData = data.trends.last30Days;
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const maxOrders = Math.max(...chartData.map(d => d.orders), 1);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-pc-muted">Deep dive into your store&apos;s performance</p>
      </div>

      {/* Summary Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="All-Time Revenue"
            value={`$${data.summary.revenue.allTime.toFixed(2)}`}
            accent="gold"
          />
          <StatsCard 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>}
            label="All-Time Orders"
            value={data.summary.orders.allTime}
            accent="blue"
          />
          <StatsCard 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            label="This Month Revenue"
            value={`$${data.summary.revenue.thisMonth.toFixed(2)}`}
            accent="emerald"
          />
          <StatsCard 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            label="Avg Order Value"
            value={`$${data.summary.aov.toFixed(2)}`}
            accent="purple"
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-white">Revenue & Orders</h2>
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="text-sm font-bold text-pc-green">
              ${data.trends.last30Days.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)} total
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-3">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-pc-green/50 border border-pc-green/50 rounded-sm"></div> Revenue</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-0 border-t-2 border-pc-gold/80 rounded-sm"></div> Orders</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 flex items-end gap-2 sm:gap-3 relative">
          {chartData.map((period, i) => {
            const revenueHeight = Math.max((period.revenue / maxRevenue) * 100, 2);
            const ordersHeight = Math.max((period.orders / maxOrders) * 100, 2);
            const nextPeriod = chartData[i + 1];
            const nextOrdersHeight = nextPeriod ? Math.max((nextPeriod.orders / maxOrders) * 100, 2) : null;
            
            const daysFromEnd = (chartData.length - 1) - i;
            const isWeekBoundary = daysFromEnd > 0 && daysFromEnd % 7 === 0;

            return (
              <div key={period.date} className="relative flex-1 group flex flex-col justify-end h-full">
                {/* SVG Line to next point */}
                {nextPeriod && (
                  <svg className="absolute w-[calc(100%+0.5rem)] sm:w-[calc(100%+0.75rem)] h-full overflow-visible pointer-events-none z-20" style={{ left: '50%' }}>
                    <line 
                      x1="0" y1={`${100 - ordersHeight}%`} 
                      x2="100%" y2={`${100 - nextOrdersHeight}%`} 
                      stroke="#fbbf24" strokeWidth="2" 
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}
                {/* Data point circle on hover */}
                <div 
                  className="absolute w-2 h-2 rounded-full bg-pc-gold opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none"
                  style={{ left: 'calc(50% - 0.25rem)', bottom: `calc(${ordersHeight}% - 0.25rem)` }}
                />

                {/* Week Boundary Divider */}
                {isWeekBoundary && (
                  <div className="absolute top-0 right-[-0.25rem] sm:right-[-0.375rem] w-px h-full bg-pc-border border-r border-dashed z-0 opacity-50"></div>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none whitespace-nowrap">
                  {new Date(period.date).toLocaleDateString()}<br/>
                  ${period.revenue.toFixed(2)} ({period.orders} orders)
                </div>
                
                {/* Revenue Bar */}
                <div className="w-full h-full flex items-end">
                  <div 
                    className="flex-1 bg-pc-green/20 group-hover:bg-pc-green/50 border-t border-pc-green/50 rounded-t-sm transition-all duration-300 relative z-10"
                    style={{ height: `${revenueHeight}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-pc-muted mt-4 font-bold uppercase tracking-wider relative">
          <span>{chartData.length > 0 ? new Date(chartData[0].date).toLocaleDateString() : ''}</span>
          <span>{chartData.length > 0 ? new Date(chartData[chartData.length - 1].date).toLocaleDateString() : ''}</span>
        </div>
      </div>

      {/* Top Performers by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {renderProductList("Overall Top Sellers", data.topProducts.slice(0, 5))}
        {renderProductList("Top Flower", data.topFlower)}
        {renderProductList("Top Edibles", data.topEdibles)}
        {renderProductList("Top Vapes & Carts", data.topCarts)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Customers */}
        {data.topCustomers && data.topCustomers.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Top Customers</h2>
            <div className="space-y-4">
              {data.topCustomers.map((customer, index) => (
                <div key={customer.phone} className="flex items-center justify-between p-4 bg-pc-black rounded-xl border border-pc-border">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-pc-dark flex items-center justify-center font-bold text-pc-muted border border-pc-border">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-bold">{customer.name}</p>
                      <p className="text-xs text-pc-muted">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{customer.ordersCount} orders</p>
                    <p className="text-sm text-pc-gold">${customer.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdowns */}
        <div className="space-y-8">
          
          {/* Delivery vs Pickup */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Fulfillment Split</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-pc-black rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-2">Delivery</p>
                <p className="text-2xl font-black text-white mb-1">{data.deliverySplit.DELIVERY.count} <span className="text-sm font-normal text-pc-muted">orders</span></p>
                <p className="text-pc-gold font-bold">${data.deliverySplit.DELIVERY.revenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-pc-black rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-2">Pickup</p>
                <p className="text-2xl font-black text-white mb-1">{data.deliverySplit.PICKUP.count} <span className="text-sm font-normal text-pc-muted">orders</span></p>
                <p className="text-pc-green font-bold">${data.deliverySplit.PICKUP.revenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Category Split */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Sales by Category</h2>
            <div className="space-y-4">
              {Object.entries(data.categorySplit).length === 0 ? (
                <p className="text-pc-muted">No category data yet.</p>
              ) : (
                Object.entries(data.categorySplit).map(([cat, stats]) => (
                  <div key={cat} className="flex justify-between items-center p-4 bg-pc-black rounded-xl border border-pc-border">
                    <p className="font-bold text-white">{cat}</p>
                    <div className="text-right">
                      <p className="text-white font-bold">{stats.quantity} units</p>
                      <p className="text-sm text-pc-green">${stats.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Discounts */}
          {data.topDiscounts.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Discount Usage</h2>
              <div className="space-y-4">
                {data.topDiscounts.map((discount) => (
                  <div key={discount.name} className="flex justify-between items-center p-4 bg-pc-black rounded-xl border border-pc-border">
                    <p className="font-bold text-white">{discount.name}</p>
                    <div className="text-right">
                      <p className="text-white font-bold">{discount.count} times used</p>
                      <p className="text-sm text-pc-gold">Saved customers ${discount.totalSaved.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
