'use client';

import { useState } from 'react';

export default function CustomersTable({ initialCustomers }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [editingId, setEditingId] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setEditPoints(customer.points.toString());
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ points: parseInt(editPoints, 10) })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setCustomers(customers.map(c => c.id === id ? { ...c, points: updated.points } : c));
        setEditingId(null);
      } else {
        alert('Failed to update points');
      }
    } catch (err) {
      alert('Error updating points');
    } finally {
      setSaving(false);
    }
  };

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
      } else {
        alert('Failed to delete customer');
      }
    } catch (err) {
      alert('Error deleting customer');
    } finally {
      setSaving(false);
    }
  };

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
        alert(`Success! Migrated ${data.migratedOrders} orders and created ${data.newCustomersCreated} new customer profiles. Please refresh the page to see the updated table.`);
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

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const currentCustomers = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleMigrate}
          disabled={saving}
          className="btn-secondary px-4 py-2 text-sm"
        >
          {saving ? 'Processing...' : 'Reward Past Orders'}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-pc-dark/50 text-pc-muted border-b border-pc-border">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Phone</th>
              <th className="px-6 py-4 font-medium">Points</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pc-border/50">
            {currentCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{customer.name}</td>
                <td className="px-6 py-4 text-pc-muted">
                  {customer.email ? customer.email : <span className="text-pc-muted/50">Guest</span>}
                </td>
                <td className="px-6 py-4 text-pc-muted">{customer.phone}</td>
                <td className="px-6 py-4 text-pc-green font-bold">
                  {editingId === customer.id ? (
                    <input 
                      type="number"
                      value={editPoints}
                      onChange={(e) => setEditPoints(e.target.value)}
                      className="w-20 bg-pc-black border border-pc-border rounded px-2 py-1 text-white text-sm"
                    />
                  ) : (
                    customer.points
                  )}
                </td>
                <td className="px-6 py-4 text-white">{customer.totalOrders}</td>
                <td className="px-6 py-4 text-pc-muted">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === customer.id ? (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleSave(customer.id)}
                        disabled={saving}
                        className="text-pc-green hover:text-white transition-colors"
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="text-pc-muted hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="text-pc-muted hover:text-pc-green transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        disabled={saving}
                        className="text-pc-muted hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-pc-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <p className="text-sm text-pc-muted">
            Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, customers.length)}</span> of <span className="font-medium text-white">{customers.length}</span> customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-pc-border bg-pc-dark text-pc-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="text-sm text-pc-muted font-medium px-2">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-pc-border bg-pc-dark text-pc-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
