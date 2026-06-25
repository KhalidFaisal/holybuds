'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ products: 0, ordersToday: 0, revenue: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders', { headers }),
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      const products = Array.isArray(productsData) ? productsData : [];
      const orders = Array.isArray(ordersData) ? ordersData : [];

      // Calculate stats
      const today = new Date().toDateString();
      const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
      const revenue = ordersToday.reduce((sum, o) => sum + o.total, 0);
      const lowStock = products.filter((p) => p.stock <= 10);

      setStats({
        products: products.length,
        ordersToday: ordersToday.length,
        revenue,
        lowStock: lowStock.length,
      });

      setRecentOrders(orders.slice(0, 5));
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-pc-muted">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-pc-muted">Welcome back to Holybuds admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>} label="Total Products" value={stats.products} accent="emerald" />
        <StatsCard icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>} label="Orders Today" value={stats.ordersToday} accent="blue" />
        <StatsCard icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Revenue Today" value={`$${stats.revenue.toFixed(2)}`} accent="gold" />
        <StatsCard icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} label="Low Stock" value={stats.lowStock} accent={stats.lowStock > 0 ? 'red' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <Link href="/admin/dashboard/orders" className="text-pc-green text-sm hover:text-pc-green-light transition-colors">
              View All →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-pc-muted text-sm py-4">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-pc-dark/50 hover:bg-pc-dark transition-colors">
                  <div>
                    <p className="text-white font-semibold text-sm">{order.orderNumber}</p>
                    <p className="text-pc-muted text-xs">{order.customerName} • {order.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <p className="text-white font-semibold text-sm mt-1">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Low Stock Alerts</h2>
            <Link href="/admin/dashboard/products" className="text-pc-green text-sm hover:text-pc-green-light transition-colors">
              Manage →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-4">
              <p className="flex items-center gap-2 text-pc-green text-sm font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>All products well stocked</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-pc-dark/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pc-border">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{product.name}</p>
                      <p className="text-pc-muted text-xs">{product.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {product.stock === 0 ? 'OUT' : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
