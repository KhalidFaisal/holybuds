'use client';

import { useState, useEffect } from 'react';

const ImageUploadField = ({ name, label, initialValue }) => {
  const [uploading, setUploading] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Upload failed with status ${res.status}`);
      }
      const data = await res.json();
      setValue(data.url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-pc-muted">{label}</label>
      <div className="flex items-center gap-4">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-16 w-16 object-cover rounded border border-pc-border" />
        )}
        <input type="hidden" name={name} value={value} />
        <label className={`btn-secondary text-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? 'Uploading...' : (value ? 'Change Image' : 'Upload Image')}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
        </label>
      </div>
    </div>
  );
};


export default function CategoriesClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);


  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const categoryData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      image: formData.get('image'),
      isActive: formData.get('isActive') === 'on',
      order: parseInt(formData.get('order') || 0),
    };

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
      
      setIsFormOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) return <div className="text-pc-muted animate-pulse">Loading categories...</div>;
  if (error) return <div className="text-red-500 bg-red-500/10 p-4 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}
          className="btn-primary"
        >
          + Add New Category
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pc-muted">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={editingCategory?.name}
                    className="input-field" 
                    placeholder="e.g. Flowers"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pc-muted">Slug (URL friendly)</label>
                  <input 
                    type="text" 
                    name="slug" 
                    defaultValue={editingCategory?.slug}
                    className="input-field" 
                    placeholder="e.g. FLOWER"
                  />
                </div>
              </div>

              <ImageUploadField 
                name="image" 
                label="Category Image (e.g. square icon or photo)" 
                initialValue={editingCategory?.image} 
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pc-muted">Order (Priority)</label>
                  <input 
                    type="number" 
                    name="order" 
                    defaultValue={editingCategory?.order || 0}
                    className="input-field" 
                  />
                </div>

                <div className="flex items-center gap-3 pt-8 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    defaultChecked={editingCategory ? editingCategory.isActive : true}
                    className="modern-toggle"
                  />
                  <label className="text-sm font-medium text-white cursor-pointer">Active</label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-pc-border">
                <button type="submit" className="btn-primary flex-1">Save Category</button>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="glass-card p-4 flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-24 h-24 bg-pc-smoke rounded-xl overflow-hidden relative shrink-0">
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pc-muted text-xs p-2 text-center">No Image</div>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-white text-lg">{category.name}</h3>
                {!category.isActive && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-500">Inactive</span>
                )}
              </div>
              <p className="text-sm text-pc-muted">Slug: {category.slug}</p>
              <p className="text-sm text-pc-muted">Order: {category.order}</p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => handleEdit(category)} className="btn-secondary flex-1 md:flex-none">Edit</button>
              <button onClick={() => handleDelete(category.id)} className="px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 font-medium transition-colors flex-1 md:flex-none">Delete</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center p-12 glass-card text-pc-muted">
            No categories found. Create your first category to display on the storefront!
          </div>
        )}
      </div>
    </div>
  );
}
