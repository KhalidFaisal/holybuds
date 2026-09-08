'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

export default function CustomersTable({ initialCustomers, timezone = 'UTC' }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'activity'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Edit Customer Modal State
  const [editCustomer, setEditCustomer] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [editStoreCredit, setEditStoreCredit] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Global Activity Logs State
  const [activityEvents, setActivityEvents] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL');

  // Format date helper
  const formatDate = (dateStr, includeTime = true) => {
    if (!dateStr) return '—';
    try {
      const options = {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
      };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(dateStr));
    } catch {
      return new Date(dateStr).toLocaleDateString();
    }
  };

  // Open Customer History Modal
  const openHistoryModal = async (customer) => {
    setHistoryCustomer(customer);
    setHistoryTimeline([]);
    setHistoryStats(null);
    setExpandedOrders({});
    setIsHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to load customer history');
      const data = await res.json();
      setHistoryTimeline(data.timeline || []);
      setHistoryStats(data.stats || null);
      if (data.customer) {
        setHistoryCustomer(data.customer);
      }
    } catch (err) {
      alert(err.message || 'Error loading history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Global Activity Logs
  const fetchGlobalActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch('/api/admin/customers/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load customer activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }, []);


  // Open Edit Modal
  const openEditModal = (customer) => {
    setEditCustomer(customer);
    setEditPoints(customer.points.toString());
    setEditStoreCredit((customer.storeCredit || 0).toString());
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${editCustomer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          points: parseInt(editPoints, 10) || 0,
          storeCredit: parseFloat(editStoreCredit) || 0
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomers(prev => prev.map(c => c.id === editCustomer.id ? {
          ...c,
          points: updated.points,
          storeCredit: updated.storeCredit
        } : c));
        if (historyCustomer && historyCustomer.id === editCustomer.id) {
          setHistoryCustomer(prev => ({
            ...prev,
            points: updated.points,
            storeCredit: updated.storeCredit
          }));
        }
        setEditCustomer(null);
      } else {
        alert('Failed to update customer');
      }
    } catch (err) {
      alert('Error updating customer');
    } finally {
      setSaving(false);
    }
  };

  // Delete Customer
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete their web account if they have one. This cannot be undone.')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (res.ok) {
        setCustomers(customers.filter(c => c.id !== id));
        if (isHistoryOpen && historyCustomer?.id === id) {
          setIsHistoryOpen(false);
        }
      } else {
        alert('Failed to delete customer');
      }
    } catch (err) {
      alert('Error deleting customer');
    } finally {
      setSaving(false);
    }
  };

  // Migrate past orders
  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to scan all past orders and reward points to customers? This may take a moment.')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/migrate-customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Migrated ${data.migratedOrders} orders and created ${data.newCustomersCreated} new customer profiles.`);
        window.location.reload();
      } else {
        alert('Failed to migrate: ' + data.error);
      }
    } catch (err) {
      alert('Error running migration');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Order Items Expansion
  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.referralCode?.toLowerCase().includes(q) ||
      c.referredByCode?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const currentCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filtered Global Activity Events
  const filteredActivityEvents = useMemo(() => {
    if (activityFilter === 'ALL') return activityEvents;
    return activityEvents.filter(e => e.type === activityFilter);
  }, [activityEvents, activityFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Customers &amp; Loyalty</h1>
          <p className="text-pc-muted text-sm">
            Manage customer accounts, inspect purchase and referral logs, and adjust loyalty balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMigrate}
            disabled={saving}
            className="btn-secondary px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {saving ? 'Processing...' : 'Reward Past Orders'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-pc-border gap-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-pc-green text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-pc-muted hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Customers Directory
          <span className="px-2 py-0.5 rounded-full bg-pc-black text-xs font-mono border border-pc-border text-pc-muted">
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('activity');
            fetchGlobalActivity();
          }}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-pc-green text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-pc-muted hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Customer Activity &amp; History Logs
          {activityEvents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-mono font-bold">
              {activityEvents.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pc-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, phone, email, or referral code..."
              className="w-full bg-pc-dark border border-pc-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-pc-muted/60 text-sm focus:outline-none focus:border-pc-green transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-pc-muted hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-pc-dark/70 text-pc-muted border-b border-pc-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Store Credit</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Referral Code</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pc-border/50">
                  {currentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          {customer.name}
                        </div>
                        {customer.address && (
                          <div className="text-xs text-pc-muted truncate max-w-xs">{customer.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-mono text-xs">{customer.phone}</div>
                        <div className="text-xs text-pc-muted">
                          {customer.email ? customer.email : <span className="text-pc-muted/50">No account</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-pc-green">
                          {customer.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono font-bold ${customer.storeCredit > 0 ? 'text-yellow-400' : 'text-pc-muted'}`}>
                          ${(customer.storeCredit || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-white font-semibold">{customer.totalOrders}</span>
                      </td>
                      <td className="px-6 py-4">
                        {customer.referralCode ? (
                          <span className="px-2 py-0.5 rounded bg-pc-black border border-pc-border text-xs font-mono font-bold text-pc-green">
                            {customer.referralCode}
                          </span>
                        ) : (
                          <span className="text-xs text-pc-muted">—</span>
                        )}
                        {customer.referredByCode && (
                          <div className="text-[10px] text-pc-muted mt-0.5">
                            Ref by: <span className="text-white font-mono">{customer.referredByCode}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-pc-muted whitespace-nowrap">
                        {formatDate(customer.createdAt, false)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openHistoryModal(customer)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                            title="View customer activity & orders history"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="px-2.5 py-1 rounded-lg bg-pc-dark border border-pc-border text-pc-muted hover:text-white hover:border-pc-muted transition-all text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            disabled={saving}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-pc-muted">
                        No customers found matching &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-sm text-pc-muted">
                Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-medium text-white">{filteredCustomers.length}</span> customers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-pc-border bg-pc-dark text-pc-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Previous
                </button>
                <div className="text-sm text-pc-muted font-medium px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-pc-border bg-pc-dark text-pc-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL CUSTOMER ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-pc-dark/40 p-4 rounded-xl border border-pc-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-pc-muted uppercase tracking-wider">Filter Events:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['ALL', 'ORDER', 'REFERRAL_REWARD', 'SIGNUP'].map(type => (
                  <button
                    key={type}
                    onClick={() => setActivityFilter(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activityFilter === type
                        ? 'bg-pc-green text-black'
                        : 'bg-pc-black border border-pc-border text-pc-muted hover:text-white'
                    }`}
                  >
                    {type === 'ALL' ? 'All Logs' : type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchGlobalActivity}
              disabled={activityLoading}
              className="px-3 py-1.5 rounded-lg bg-pc-black border border-pc-border text-xs text-pc-muted hover:text-white transition-all flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${activityLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Feed
            </button>
          </div>

          {activityLoading ? (
            <div className="text-center text-pc-muted py-16 bg-pc-dark/20 border border-pc-border rounded-2xl">
              <div className="animate-spin w-8 h-8 border-2 border-pc-green border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading customer logs...
            </div>
          ) : filteredActivityEvents.length === 0 ? (
            <div className="text-center text-pc-muted py-16 bg-pc-dark/20 border border-pc-border rounded-2xl">
              No recent customer activity logs recorded.
            </div>
          ) : (
            <div className="relative border-l-2 border-pc-border ml-4 space-y-6 pb-6">
              {filteredActivityEvents.map((event) => (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-pc-dark ${
                    event.type === 'ORDER' ? 'bg-pc-green' :
                    event.type === 'REFERRAL_REWARD' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />

                  <div className="bg-pc-dark border border-pc-border rounded-xl p-4 hover:border-pc-muted/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                          event.type === 'ORDER' ? 'bg-pc-green/10 text-pc-green border border-pc-green/20' :
                          event.type === 'REFERRAL_REWARD' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' :
                          'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                        }`}>
                          {event.type.replace('_', ' ')}
                        </span>

                        {event.orderNumber && (
                          <Link
                            href={`/admin/dashboard/orders?search=${event.orderNumber}`}
                            className="font-mono text-xs text-white hover:text-pc-green font-bold transition-colors"
                          >
                            #{event.orderNumber}
                          </Link>
                        )}
                      </div>

                      <span className="text-xs text-pc-muted">
                        {formatDate(event.date)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-1">
                      <div>
                        {event.type === 'ORDER' && (
                          <div>
                            <p className="text-white text-sm font-medium">
                              {event.customerName} <span className="text-pc-muted text-xs font-mono">({event.customerPhone})</span>
                            </p>
                            <p className="text-xs text-pc-muted mt-0.5">
                              Status: <span className="font-semibold text-white uppercase">{event.status}</span> &bull; {event.itemCount} item(s)
                            </p>
                          </div>
                        )}

                        {event.type === 'REFERRAL_REWARD' && (
                          <div>
                            <p className="text-white text-sm font-medium">
                              Referrer: <span className="text-pc-green font-bold">{event.referrerName}</span>
                            </p>
                            <p className="text-xs text-pc-muted mt-0.5">
                              Referred Friend: <span className="text-white">{event.refereeName}</span>
                              {event.orderNumber && <> on Order #{event.orderNumber}</>}
                            </p>
                          </div>
                        )}

                        {event.type === 'SIGNUP' && (
                          <div>
                            <p className="text-white text-sm font-medium">
                              {event.customerName} <span className="text-pc-muted text-xs font-mono">({event.customerPhone})</span>
                            </p>
                            <p className="text-xs text-pc-muted mt-0.5">
                              New profile created {event.customerEmail ? `(${event.customerEmail})` : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Amounts / Metrics */}
                      <div className="text-right shrink-0">
                        {event.type === 'ORDER' && (
                          <div>
                            <span className="text-base font-bold text-white font-mono">
                              ${event.total?.toFixed(2)}
                            </span>
                            {(event.pointsEarned > 0 || event.pointsUsed > 0 || event.creditUsed > 0) && (
                              <div className="text-[11px] text-pc-muted space-x-1">
                                {event.pointsEarned > 0 && <span className="text-pc-green">+{event.pointsEarned} pts</span>}
                                {event.pointsUsed > 0 && <span className="text-red-400">-{event.pointsUsed} pts</span>}
                                {event.creditUsed > 0 && <span className="text-yellow-400">-${event.creditUsed.toFixed(2)} credit</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {event.type === 'REFERRAL_REWARD' && (
                          <div>
                            {event.rewardCredit > 0 && (
                              <div className="text-base font-bold text-yellow-400 font-mono">
                                +${event.rewardCredit.toFixed(2)} Credit
                              </div>
                            )}
                            {event.rewardPoints > 0 && (
                              <div className="text-base font-bold text-pc-green font-mono">
                                +{event.rewardPoints} Points
                              </div>
                            )}
                          </div>
                        )}

                        {event.customerId && (
                          <button
                            onClick={() => {
                              const found = customers.find(c => c.id === event.customerId);
                              if (found) openHistoryModal(found);
                              else openHistoryModal({ id: event.customerId, name: event.customerName, phone: event.customerPhone });
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium underline mt-1 block"
                          >
                            View Customer History &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOMER HISTORY MODAL */}
      {isHistoryOpen && historyCustomer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-pc-border bg-pc-black/40 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white">{historyCustomer.name}</h2>
                  {historyStats?.flags?.map(flag => (
                    <span key={flag} className="px-2 py-0.5 rounded bg-pc-green/10 text-pc-green border border-pc-green/20 text-xs font-bold">
                      {flag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-pc-muted">
                  <span className="font-mono text-white">{historyCustomer.phone}</span>
                  {historyCustomer.email && <span>{historyCustomer.email}</span>}
                  {historyCustomer.referralCode && (
                    <span>Code: <span className="font-mono text-pc-green font-bold">{historyCustomer.referralCode}</span></span>
                  )}
                  {historyCustomer.referredByCode && (
                    <span>Referred by: <span className="font-mono text-white">{historyCustomer.referredByCode}</span></span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-pc-muted hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-pc-black/20 border-b border-pc-border">
              <div className="bg-pc-black border border-pc-border p-3.5 rounded-xl">
                <span className="text-xs text-pc-muted block uppercase font-semibold">Lifetime Spend</span>
                <span className="text-xl font-bold font-mono text-white">
                  ${(historyStats?.lifetimeSpend || 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-pc-black border border-pc-border p-3.5 rounded-xl">
                <span className="text-xs text-pc-muted block uppercase font-semibold">Orders</span>
                <span className="text-xl font-bold font-mono text-white">
                  {historyStats?.completedOrdersCount || historyCustomer.totalOrders || 0}
                </span>
              </div>

              <div className="bg-pc-black border border-pc-border p-3.5 rounded-xl">
                <span className="text-xs text-pc-muted block uppercase font-semibold">Loyalty Points</span>
                <span className="text-xl font-bold font-mono text-pc-green">
                  {(historyCustomer.points || 0).toLocaleString()}
                </span>
              </div>

              <div className="bg-pc-black border border-pc-border p-3.5 rounded-xl">
                <span className="text-xs text-pc-muted block uppercase font-semibold">Store Credit</span>
                <span className="text-xl font-bold font-mono text-yellow-400">
                  ${(historyCustomer.storeCredit || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Activity &amp; Purchase Timeline
                </h3>
                <span className="text-xs text-pc-muted">
                  {historyTimeline.length} recorded events
                </span>
              </div>

              {historyLoading ? (
                <div className="text-center py-12 text-pc-muted">
                  <div className="animate-spin w-8 h-8 border-2 border-pc-green border-t-transparent rounded-full mx-auto mb-3"></div>
                  Loading timeline details...
                </div>
              ) : historyTimeline.length === 0 ? (
                <div className="text-center py-12 text-pc-muted bg-pc-black/40 rounded-xl border border-pc-border">
                  No purchase or referral events recorded yet for this customer.
                </div>
              ) : (
                <div className="relative border-l-2 border-pc-border ml-3 space-y-6">
                  {historyTimeline.map((item, idx) => (
                    <div key={item.id || idx} className="relative pl-6">
                      {/* Dot */}
                      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-pc-dark ${
                        item.type === 'ORDER' ? (item.status === 'CANCELLED' ? 'bg-red-500' : 'bg-pc-green') :
                        item.type === 'REFERRAL_REWARD' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`} />

                      <div className="bg-pc-black border border-pc-border rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              item.type === 'ORDER' ? (item.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-pc-green/10 text-pc-green') :
                              item.type === 'REFERRAL_REWARD' ? 'bg-yellow-400/10 text-yellow-400' :
                              'bg-blue-400/10 text-blue-400'
                            }`}>
                              {item.type === 'ORDER' ? `Order #${item.orderNumber}` : item.type.replace('_', ' ')}
                            </span>

                            {item.status && (
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                item.status === 'COMPLETED' || item.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-500/10' :
                                item.status === 'CANCELLED' ? 'text-red-400 bg-red-500/10' :
                                'text-yellow-400 bg-yellow-500/10'
                              }`}>
                                {item.status}
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-pc-muted">
                            {formatDate(item.date)}
                          </span>
                        </div>

                        {/* ORDER CONTENT */}
                        {item.type === 'ORDER' && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-lg font-bold text-white font-mono">
                                  ${item.total?.toFixed(2)}
                                </span>
                                {item.discountAmount > 0 && (
                                  <span className="text-xs text-pc-muted ml-2">
                                    (Discount: -${item.discountAmount.toFixed(2)})
                                  </span>
                                )}
                              </div>

                              <div className="text-right text-xs space-x-2">
                                {item.pointsEarned > 0 && (
                                  <span className="text-pc-green font-bold">+{item.pointsEarned} pts</span>
                                )}
                                {item.pointsUsed > 0 && (
                                  <span className="text-red-400 font-bold">-{item.pointsUsed} pts</span>
                                )}
                                {item.creditUsed > 0 && (
                                  <span className="text-yellow-400 font-bold">-${item.creditUsed.toFixed(2)} credit</span>
                                )}
                              </div>
                            </div>

                            {/* Items toggle */}
                            {item.items?.length > 0 && (
                              <div>
                                <button
                                  onClick={() => toggleOrderExpand(item.id)}
                                  className="text-xs text-pc-muted hover:text-white flex items-center gap-1 font-medium transition-colors"
                                >
                                  <span>{expandedOrders[item.id] ? 'Hide Items' : `View ${item.items.length} Item(s)`}</span>
                                  <svg className={`w-3 h-3 transition-transform ${expandedOrders[item.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {expandedOrders[item.id] && (
                                  <div className="mt-2 bg-pc-dark/60 rounded-lg p-2.5 border border-pc-border/50 divide-y divide-pc-border/30 text-xs">
                                    {item.items.map((prod, pIdx) => (
                                      <div key={pIdx} className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0">
                                        <div className="text-white">
                                          <span className="font-bold text-pc-green">{prod.quantity}x</span> {prod.name}
                                        </div>
                                        <span className="font-mono text-pc-muted">
                                          ${(prod.price * prod.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* REFERRAL REWARD CONTENT */}
                        {item.type === 'REFERRAL_REWARD' && (
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <p className="text-white font-medium">
                                Referred Friend: <span className="font-bold text-white">{item.refereeName}</span>
                              </p>
                              {item.orderNumber && (
                                <p className="text-pc-muted text-[11px]">Qualified on Order #{item.orderNumber}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.rewardCredit > 0 && (
                                <span className="text-sm font-bold text-yellow-400 font-mono block">
                                  +${item.rewardCredit.toFixed(2)} Credit
                                </span>
                              )}
                              {item.rewardPoints > 0 && (
                                <span className="text-sm font-bold text-pc-green font-mono block">
                                  +{item.rewardPoints} Points
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SIGNUP CONTENT */}
                        {item.type === 'SIGNUP' && (
                          <div className="text-xs text-pc-muted">
                            {item.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-pc-border bg-pc-black/40 flex justify-between items-center">
              <button
                onClick={() => openEditModal(historyCustomer)}
                className="btn-secondary px-4 py-2 text-xs font-bold"
              >
                Adjust Points &amp; Credit
              </button>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POINTS & STORE CREDIT MODAL */}
      {editCustomer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Adjust Balances</h3>
                <p className="text-xs text-pc-muted">{editCustomer.name} ({editCustomer.phone})</p>
              </div>
              <button
                onClick={() => setEditCustomer(null)}
                className="text-pc-muted hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1.5">
                  Loyalty Points Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white font-mono focus:border-pc-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1.5">
                  Store Credit Balance ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editStoreCredit}
                  onChange={(e) => setEditStoreCredit(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2.5 text-white font-mono focus:border-pc-green focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
