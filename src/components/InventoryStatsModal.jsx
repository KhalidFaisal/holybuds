import { useState, useEffect } from 'react';

export default function InventoryStatsModal({ productId, productName, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`/api/admin/products/${productId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load stats');
        
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [productId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-pc-dark border border-pc-border p-6 rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Inventory Analytics</h2>
            <p className="text-sm text-pc-muted">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-pc-black rounded-lg text-pc-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-pc-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-pc-muted text-sm">Calculating metrics...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pc-black p-4 rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Current Stock</p>
                <p className={`text-2xl font-black ${stats.stock === 0 ? 'text-red-500' : 'text-white'}`}>{stats.stock}</p>
              </div>
              <div className="bg-pc-black p-4 rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Days to OOS</p>
                <p className="text-2xl font-black text-pc-green">{stats.daysUntilOos}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pc-black p-4 rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Sold Today</p>
                <p className="text-xl font-bold text-white">{stats.unitsSoldToday}</p>
              </div>
              <div className="bg-pc-black p-4 rounded-xl border border-pc-border">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Sold This Week</p>
                <p className="text-xl font-bold text-white">{stats.unitsSoldThisWeek}</p>
              </div>
            </div>

            <div className="bg-pc-black p-4 rounded-xl border border-pc-border flex justify-between items-center">
              <div>
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Avg. Daily Sales</p>
                <p className="text-lg font-bold text-white">{stats.averageDailySales} units/day</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-pc-muted uppercase font-bold tracking-wider mb-1">Last Sold</p>
                <p className="text-sm font-semibold text-white">
                  {stats.lastSold ? new Date(stats.lastSold).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
