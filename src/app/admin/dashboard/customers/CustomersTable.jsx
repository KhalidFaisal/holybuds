'use client';

import { useState } from 'react';

export default function CustomersTable({ initialCustomers }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [editingId, setEditingId] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-pc-dark/50 text-pc-muted border-b border-pc-border">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Phone</th>
              <th className="px-6 py-4 font-medium">Points</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pc-border/50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{customer.name}</td>
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
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="text-pc-muted hover:text-pc-green transition-colors"
                    >
                      Edit Points
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-pc-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
