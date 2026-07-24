'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderValue: '0',
    targetType: 'ENTIRE_ORDER',
    targetCategory: '',
    targetProductIds: [],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [discRes, prodRes, catRes] = await Promise.all([
        fetch('/api/admin/discounts'),
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      if (discRes.ok) setDiscounts(await discRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductToggle = (productId) => {
    setForm(prev => {
      const ids = prev.targetProductIds.includes(productId)
        ? prev.targetProductIds.filter(id => id !== productId)
        : [...prev.targetProductIds, productId];
      return { ...prev, targetProductIds: ids };
    });
  };

  const handleEdit = (discount) => {
    setEditingId(discount.id);
    setProductSearch('');
    let targetIds = [];
    if (discount.targetProductIds) {
      try {
        const parsed = JSON.parse(discount.targetProductIds);
        if (Array.isArray(parsed)) {
          targetIds = parsed;
        }
      } catch (e) {}
    }

    setForm({
      name: discount.name,
      type: discount.type,
      value: discount.value?.toString() || '',
      minOrderValue: discount.minOrderValue?.toString() || '0',
      targetType: discount.targetType,
      targetCategory: discount.targetCategory || '',
      targetProductIds: targetIds,
      isActive: discount.isActive ?? true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setProductSearch('');
    setForm({
      name: '',
      type: 'PERCENTAGE',
      value: '',
      minOrderValue: '0',
      targetType: 'ENTIRE_ORDER',
      targetCategory: '',
      targetProductIds: [],
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      value: parseFloat(form.value),
      minOrderValue: parseFloat(form.minOrderValue || 0),
      targetProductIds: form.targetType === 'SPECIFIC_PRODUCTS' ? JSON.stringify(form.targetProductIds) : null,
      targetCategory: form.targetType === 'CATEGORY' ? form.targetCategory : null,
    };

    try {
      const url = editingId ? `/api/admin/discounts/${editingId}` : '/api/admin/discounts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save discount');
      }

      await fetchData();
      handleCancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading discounts...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Automatic Discounts</h1>
        <p className="text-pc-muted">Manage automatic checkout rules</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {editingId ? 'Edit Discount' : 'Create New Discount'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Discount Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="e.g. 10% Off Edibles" />
            </div>

            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Status</label>
              <label className="flex items-center gap-3 mt-3 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="modern-toggle" />
                <span className="text-white font-medium">Active</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Discount Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Discount Value</label>
              <input type="number" step="0.01" name="value" value={form.value} onChange={handleChange} required className="input-field" placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'} />
            </div>

            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Applies To</label>
              <select name="targetType" value={form.targetType} onChange={handleChange} className="input-field">
                <option value="ENTIRE_ORDER">Entire Order</option>
                <option value="CATEGORY">Specific Category</option>
                <option value="SPECIFIC_PRODUCTS">Specific Products</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Minimum Qualifying Subtotal ($)</label>
              <input type="number" step="0.01" name="minOrderValue" value={form.minOrderValue} onChange={handleChange} required className="input-field" />
              <p className="text-xs text-pc-muted mt-1">Set to 0 for no minimum.</p>
            </div>
          </div>

          {form.targetType === 'CATEGORY' && (
            <div className="border-t border-pc-border pt-6 mt-6">
              <label className="block text-sm font-medium text-pc-muted mb-1">Select Category</label>
              <select name="targetCategory" value={form.targetCategory} onChange={handleChange} required className="input-field max-w-md">
                <option value="">-- Choose Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {form.targetType === 'SPECIFIC_PRODUCTS' && (
            <div className="border-t border-pc-border pt-6 mt-6">
              <label className="block text-sm font-medium text-pc-muted mb-3">Select Products</label>
              
              {/* Search Box */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="max-h-60 overflow-y-auto bg-pc-dark border border-pc-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                {products
                  .filter(product => product.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map(product => (
                  <label key={product.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <input 
                      type="checkbox" 
                      checked={form.targetProductIds.includes(product.id)}
                      onChange={() => handleProductToggle(product.id)}
                      className="modern-checkbox" 
                    />
                    <span className="text-white text-sm">{product.name}</span>
                    <span className="text-pc-muted text-xs ml-auto">${product.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingId ? 'Update Discount' : 'Create Discount'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold text-white bg-pc-dark border border-pc-border hover:bg-white/5 transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-pc-muted">
            <thead className="text-xs uppercase bg-pc-dark/50 text-white border-b border-pc-border">
              <tr>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Discount</th>
                <th className="px-6 py-4 font-bold">Applies To</th>
                <th className="px-6 py-4 font-bold">Min Subtotal</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pc-border">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-pc-muted">
                    No discounts found. Create one above.
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {discount.name}
                    </td>
                    <td className="px-6 py-4 text-pc-green font-semibold">
                      {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4">
                      {discount.targetType === 'ENTIRE_ORDER' && 'Entire Order'}
                      {discount.targetType === 'CATEGORY' && `Category: ${discount.targetCategory}`}
                      {discount.targetType === 'SPECIFIC_PRODUCTS' && 'Specific Products'}
                    </td>
                    <td className="px-6 py-4">
                      {discount.minOrderValue > 0 ? `$${discount.minOrderValue.toFixed(2)}` : 'None'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        discount.isActive 
                          ? 'bg-pc-green/20 text-pc-green' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEdit(discount)} className="text-pc-muted hover:text-white transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(discount.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
