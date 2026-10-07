'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import StatsCard from '@/components/StatsCard';

export default function ProfitAnalyticsPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfitData = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/analytics/profit?period=${selectedPeriod}`, { headers });
      if (!res.ok) throw new Error('Failed to load profit analytics');

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching profit analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfitData(period);
  }, [period, fetchProfitData]);

  const timeline = useMemo(() => data?.timeline || [], [data?.timeline]);
  const maxRevenue = useMemo(() => {
    if (!timeline.length) return 1;
    return Math.max(...timeline.map((d) => Math.max(d.revenue, d.grossProfit, 1)));
  }, [timeline]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Top Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-white">Profit & Loss (P&L)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Accounting
            </span>
          </div>
          <p className="text-pc-muted mt-1">
            Real-time track of product wholesale costs, gross margins, operational expenses, and net profit.
          </p>
        </div>

        {/* Time Period Filter Buttons */}
        <div className="flex items-center gap-1 bg-[#141715] p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === item.id
                  ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="glass-card p-8 text-center text-red-400 border border-red-500/30">
          <p>{error}</p>
          <button
            onClick={() => fetchProfitData(period)}
            className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Executive Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Net Sales Revenue"
              value={`$${data.summary.totalRevenue.toFixed(2)}`}
              accent="blue"
            />

            <StatsCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              }
              label="Product Cost (COGS)"
              value={`$${data.summary.totalCOGS.toFixed(2)}`}
              accent="purple"
            />

            <StatsCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              }
              label={`Gross Profit (${data.summary.grossMarginPercent.toFixed(1)}%)`}
              value={`$${data.summary.grossProfit.toFixed(2)}`}
              accent="gold"
            />

            <StatsCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              }
              label="Operating Expenses"
              value={`$${data.summary.totalOperatingExpenses.toFixed(2)}`}
              accent="amber"
            />

            {/* Net In-Pocket Profit Card */}
            <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              data.summary.netProfit >= 0
                ? 'bg-gradient-to-br from-[#0c2415] to-[#0a180e] border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                : 'bg-gradient-to-br from-[#2a0e0e] to-[#180a0a] border-red-500/40 shadow-lg shadow-red-950/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Net Profit</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
                  data.summary.netProfit >= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}>
                  {data.summary.netMarginPercent.toFixed(1)}% Net Margin
                </span>
              </div>
              <div className="mt-3">
                <p className={`text-2xl sm:text-3xl font-black ${
                  data.summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  ${data.summary.netProfit.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  In-Pocket Earnings after COGS & Operating Costs
                </p>
              </div>
            </div>
          </div>

          {/* Revenue vs Profit Timeline Chart */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Daily Revenue vs. Profit Breakdown</h2>
                <p className="text-xs text-pc-muted">Sales Revenue (green bar) vs. Gross Profit (gold line)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-pc-green/30 border border-pc-green/50 rounded-sm" />
                  <span className="text-zinc-300">Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-purple-500/30 border border-purple-500/50 rounded-sm" />
                  <span className="text-zinc-300">COGS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-pc-gold" />
                  <span className="text-zinc-300">Gross Profit</span>
                </div>
              </div>
            </div>

            <div className="h-64 flex items-end gap-1.5 sm:gap-2 relative">
              {timeline.map((day) => {
                const revHeight = Math.max((day.revenue / maxRevenue) * 100, 2);
                const profitHeight = Math.max((day.grossProfit / maxRevenue) * 100, 2);
                const cogsHeight = Math.max((day.cogs / maxRevenue) * 100, 2);

                return (
                  <div key={day.date} className="relative flex-1 group flex flex-col justify-end h-full">
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/95 text-white text-xs p-3 rounded-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none whitespace-nowrap shadow-xl">
                      <p className="font-bold text-zinc-300 border-b border-zinc-800 pb-1 mb-1.5">{day.date}</p>
                      <p className="text-pc-green">Sales: <strong>${day.revenue.toFixed(2)}</strong> ({day.orders} orders)</p>
                      <p className="text-purple-400">COGS: <strong>${day.cogs.toFixed(2)}</strong></p>
                      <p className="text-pc-gold">Gross Profit: <strong>${day.grossProfit.toFixed(2)}</strong> ({day.marginPercent}%)</p>
                      {day.expenses > 0 && (
                        <p className="text-amber-400">Expenses: <strong>-${day.expenses.toFixed(2)}</strong></p>
                      )}
                      <p className="text-emerald-400 font-bold pt-1 border-t border-zinc-800 mt-1">
                        Net Profit: ${day.netProfit.toFixed(2)}
                      </p>
                    </div>

                    {/* Stacked / Overlay Bar */}
                    <div className="w-full h-full flex items-end justify-center gap-0.5">
                      {/* Revenue Bar */}
                      <div
                        className="w-full bg-pc-green/20 group-hover:bg-pc-green/40 border-t border-pc-green/50 rounded-t-sm transition-all"
                        style={{ height: `${revHeight}%` }}
                      >
                        {/* Inner Profit Fill */}
                        <div
                          className="w-full bg-pc-gold/30 group-hover:bg-pc-gold/50 border-t border-pc-gold rounded-t-sm transition-all"
                          style={{ height: `${(profitHeight / revHeight) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs text-pc-muted mt-3 font-bold uppercase tracking-wider">
              <span>{timeline[0]?.date || ''}</span>
              <span>{timeline[timeline.length - 1]?.date || ''}</span>
            </div>
          </div>

          {/* Category Profit & Margins Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-1">Profitability by Category</h2>
              <p className="text-xs text-pc-muted mb-6">Which product categories deliver the highest dollar returns</p>

              <div className="space-y-3">
                {data.categoryProfit.length === 0 ? (
                  <p className="text-sm text-pc-muted">No sales in this period.</p>
                ) : (
                  data.categoryProfit.map((cat) => (
                    <div
                      key={cat.category}
                      className="p-4 bg-pc-black rounded-xl border border-pc-border/80 flex items-center justify-between gap-4 hover:border-emerald-500/30 transition-colors"
                    >
                      <div>
                        <p className="text-white font-bold text-sm">{cat.category}</p>
                        <p className="text-xs text-pc-muted mt-0.5">
                          {cat.unitsSold} units · Sales: ${cat.revenue.toFixed(2)} · COGS: ${cat.cogs.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">+${cat.grossProfit.toFixed(2)}</p>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mt-1">
                          {cat.marginPercent}% Margin
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Operating Expense Logs (Cash Tracker deductions) */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-white">Operating Expense Deductions</h2>
                <span className="text-xs text-pc-muted font-bold">
                  Total: ${data.summary.totalOperatingExpenses.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-pc-muted mb-6">
                Cash Tracker payouts, driver commissions, and store payroll deducted from gross profit
              </p>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {data.recentExpenses.length === 0 ? (
                  <p className="text-sm text-pc-muted">No recorded operating expenses in this period.</p>
                ) : (
                  data.recentExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 bg-pc-black rounded-xl border border-pc-border/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{exp.person}</span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                            {exp.form}
                          </span>
                        </div>
                        {exp.note && <p className="text-zinc-400 text-[11px] mt-0.5">{exp.note}</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-400">-${exp.amount.toFixed(2)}</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top 10 Most Profitable Products */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-1">Top Products by Dollar Profit Generated</h2>
            <p className="text-xs text-pc-muted mb-6">Ranked by actual net dollars earned after product cost</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-pc-border text-xs text-pc-muted font-semibold uppercase tracking-wider">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Units Sold</th>
                    <th className="pb-3 text-right">Selling Price</th>
                    <th className="pb-3 text-right">Unit Cost</th>
                    <th className="pb-3 text-right">Total Revenue</th>
                    <th className="pb-3 text-right">Total COGS</th>
                    <th className="pb-3 text-right">Total Profit</th>
                    <th className="pb-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pc-border/50">
                  {data.topProfitableProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-pc-muted w-4">{idx + 1}.</span>
                          <div>
                            <p className="font-semibold text-white">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-pc-muted">{p.category}</td>
                      <td className="py-3 text-right font-medium text-white">{p.unitsSold}</td>
                      <td className="py-3 text-right text-zinc-300 font-mono">${p.price.toFixed(2)}</td>
                      <td className="py-3 text-right text-zinc-400 font-mono">
                        {p.costPrice > 0 ? `$${p.costPrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 text-right text-zinc-200 font-mono font-medium">${p.revenue.toFixed(2)}</td>
                      <td className="py-3 text-right text-purple-400/90 font-mono">${p.cogs.toFixed(2)}</td>
                      <td className="py-3 text-right font-black text-emerald-400 font-mono">
                        +${p.grossProfit.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
