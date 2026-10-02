'use client';

import { useState, useEffect } from 'react';

const AVAILABLE_EFFECTS = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

export default function ProductForm({ product, token, onSave, onCancel }) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || 'FLOWER',
    price: product?.price || '',
    weight: product?.weight || '',
    description: product?.description || '',
    image: product?.image || '',
    stock: product?.stock || '',
    featured: product?.featured || false,
    isVisible: product?.isVisible ?? true,
  });

  const [categories, setCategories] = useState([]);

  // Multi-Category state
  const [selectedCategories, setSelectedCategories] = useState(() => {
    try {
      if (product?.categories) {
        const parsed = JSON.parse(product.categories);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return product?.category ? [product.category] : [];
  });

  const [primaryCategory, setPrimaryCategory] = useState(product?.category || '');
  
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategories(prev => {
            if (prev.length === 0) {
              const defaultCat = data[0].slug;
              setPrimaryCategory(p => p || defaultCat);
              setForm(f => ({ ...f, category: defaultCat }));
              return [defaultCat];
            }
            setPrimaryCategory(p => p || prev[0]);
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCats();
  }, []);

  const handleToggleCategory = (slug) => {
    setSelectedCategories(prev => {
      let next;
      if (prev.includes(slug)) {
        if (prev.length <= 1) return prev; // At least one category required
        next = prev.filter(s => s !== slug);
        if (primaryCategory === slug) {
          const newPrimary = next[0] || '';
          setPrimaryCategory(newPrimary);
          setForm(f => ({ ...f, category: newPrimary }));
        }
      } else {
        next = [...prev, slug];
        if (!primaryCategory) {
          setPrimaryCategory(slug);
          setForm(f => ({ ...f, category: slug }));
        }
      }
      return next;
    });
  };

  const handleSetPrimary = (e, slug) => {
    e.stopPropagation();
    setPrimaryCategory(slug);
    setForm(f => ({ ...f, category: slug }));
    if (!selectedCategories.includes(slug)) {
      setSelectedCategories(prev => [...prev, slug]);
    }
  };

  const [images, setImages] = useState(() => {
    try {
      return JSON.parse(product?.images || '[]');
    } catch {
      return product?.image ? [product.image] : [];
    }
  });

  const [effects, setEffects] = useState(() => {
    try {
      return JSON.parse(product?.effects || '[]');
    } catch {
      return [];
    }
  });

  const [newUrl, setNewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [taggingEffects, setTaggingEffects] = useState(false);
  const [error, setError] = useState('');

  const handleToggleEffect = (effect) => {
    setEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      setImages(prev => [...prev, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setImages(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMakePrimary = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.unshift(item);
      return updated;
    });
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newUploads = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        newUploads.push(data.url);
      }
      setImages(prev => [...prev, ...newUploads]);
    } catch (err) {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleAutoGenerateDescription = async () => {
    if (!form.name || !form.category) {
      setError('Please enter a name and category first to generate a description.');
      return;
    }
    
    setGeneratingDesc(true);
    setError('');
    
    try {
      const res = await fetch('/api/products/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          weight: form.weight
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate description');
      }

      const { description } = await res.json();
      setForm(prev => ({ ...prev, description }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleAutoTagEffects = async () => {
    if (!form.name && !form.description) {
      setError('Please enter a name or description to auto-tag effects.');
      return;
    }
    
    setTaggingEffects(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/products/auto-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to auto-tag effects');
      }

      const data = await res.json();
      if (data.effects) {
        setEffects(data.effects);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTaggingEffects(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isEdit ? `/api/products/${product.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          ...form, 
          category: primaryCategory || form.category,
          categories: selectedCategories,
          images, 
          effects: JSON.stringify(effects) 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      const saved = await res.json();
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="e.g. OG Kush" />
          </div>

          {/* Categories (Multi-select with Primary Star) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-pc-muted">
                Categories * <span className="text-xs text-pc-green font-normal">(Select all that apply • Click star to set Primary)</span>
              </label>
              {primaryCategory && (
                <span className="text-xs text-pc-muted">
                  Primary: <span className="font-bold text-pc-green">{categories.find(c => c.slug === primaryCategory)?.name || primaryCategory}</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 p-3 bg-pc-dark/60 border border-pc-border rounded-xl min-h-[48px] items-center">
              {categories.length > 0 ? (
                categories.map(cat => {
                  const isSelected = selectedCategories.includes(cat.slug);
                  const isPrimary = primaryCategory === cat.slug;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.slug)}
                      className={`group/cat inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border select-none ${
                        isSelected
                          ? isPrimary
                            ? 'bg-pc-green/20 border-pc-green text-pc-green shadow-sm shadow-pc-green/20'
                            : 'bg-white/10 border-white/30 text-white hover:border-white/50'
                          : 'bg-pc-smoke/30 border-pc-border text-pc-muted hover:border-pc-border/80 hover:text-white'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => handleSetPrimary(e, cat.slug)}
                          title={isPrimary ? "Primary Category" : "Click to set as Primary Category"}
                          className={`text-sm px-0.5 rounded transition-transform hover:scale-125 focus:outline-none ${
                            isPrimary ? 'text-pc-gold' : 'text-pc-muted hover:text-pc-gold'
                          }`}
                        >
                          {isPrimary ? '★' : '☆'}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-pc-muted">Loading categories...</span>
              )}
            </div>
          </div>

          {/* Price / Weight / Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Price ($) *</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className="input-field" placeholder="35.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Weight/Size (Optional)</label>
              <input name="weight" value={form.weight} onChange={handleChange} className="input-field" placeholder="3.5g, 1pc" />
            </div>
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Stock *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="input-field" placeholder="100" />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-pc-muted">Description</label>
              <button 
                type="button" 
                onClick={handleAutoGenerateDescription}
                disabled={generatingDesc || !form.name || !form.category}
                className="text-xs text-pc-green hover:text-pc-green-light disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {generatingDesc ? 'Generating...' : '✨ Auto-Generate with AI'}
              </button>
            </div>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Describe this product..." />
          </div>

          {/* Effects */}
          {form.category?.toLowerCase() === 'flowers' && (
            <div className="bg-pc-dark/30 rounded-xl p-4 border border-pc-border/50">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-white">Effects / Mood</label>
                <button 
                  type="button" 
                  onClick={handleAutoTagEffects}
                  disabled={taggingEffects || (!form.name && !form.description)}
                  className="text-xs font-bold text-pc-gold hover:text-pc-gold-light disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {taggingEffects ? 'Analyzing...' : '✨ Auto-Tag with AI'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EFFECTS.map(effect => (
                  <label 
                    key={effect} 
                    className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors border ${
                      effects.includes(effect) 
                        ? 'bg-pc-gold/20 border-pc-gold text-pc-gold' 
                        : 'bg-pc-dark border-pc-border text-pc-muted hover:border-pc-gold/50 hover:text-white'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={effects.includes(effect)} 
                      onChange={() => handleToggleEffect(effect)} 
                    />
                    {effect}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-pc-muted">
                Product Images <span className="text-xs text-pc-green font-normal">(Drag to reorder • 1st image is primary)</span>
              </label>
              {images.length > 1 && (
                <span className="text-[11px] text-pc-muted hidden sm:flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Drag left to make primary
                </span>
              )}
            </div>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="url" 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)} 
                className="input-field flex-1" 
                placeholder="Paste image URL here..." 
              />
              <button type="button" onClick={handleAddUrl} className="btn-secondary whitespace-nowrap">Add URL</button>
            </div>

            <label className={`block border-2 border-dashed border-pc-border rounded-xl p-4 text-center cursor-pointer hover:border-pc-green/50 transition-colors mb-4 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <p className="text-pc-muted text-sm">
                {uploading ? 'Uploading...' : 'Or click to upload files (can select multiple)'}
              </p>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, i) => {
                  const isPrimary = i === 0;
                  const isDragging = draggedIndex === i;
                  const isDragOver = dragOverIndex === i;

                  return (
                    <div 
                      key={`${img}-${i}`} 
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={(e) => handleDragLeave(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-pc-smoke group cursor-grab active:cursor-grabbing select-none transition-all duration-200 border-2 ${
                        isPrimary ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : 'border-transparent hover:border-pc-border'
                      } ${
                        isDragging ? 'opacity-40 scale-95 border-dashed border-pc-green' : ''
                      } ${
                        isDragOver && !isDragging ? 'ring-2 ring-pc-green ring-offset-2 ring-offset-pc-black scale-105 z-10' : ''
                      }`}
                      title={isPrimary ? "Primary Image" : "Drag left to make primary"}
                    >
                      <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover pointer-events-none" />

                      {/* Drag Handle Indicator */}
                      <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                      </div>

                      {/* Delete Button */}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(i);
                        }}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 z-20"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      {/* Primary Badge or Make Primary Action */}
                      {isPrimary ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 text-pure-white text-[10px] font-black text-center py-1 tracking-wider uppercase shadow-sm">
                          PRIMARY
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMakePrimary(i);
                          }}
                          className="absolute bottom-0 left-0 right-0 bg-black/75 hover:bg-pc-green hover:text-black text-pure-white text-[10px] font-bold text-center py-1 opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center justify-center gap-1"
                          title="Click to make this the primary image"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                          Make Primary
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Featured & Visibility */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="modern-toggle" />
              <span className="text-sm text-pc-muted">Featured product (homepage)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isVisible" checked={form.isVisible} onChange={handleChange} className="modern-toggle" />
              <span className="text-sm text-pc-muted">Visible on storefront</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-pc-border">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
