'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import CannabisIcon from '@/components/icons/CannabisIcon';
import InventoryStatsModal from '@/components/InventoryStatsModal';

function ProductsSearchParamsHandler({ onParams }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams) {
      onParams(searchParams);
    }
  }, [searchParams, onParams]);
  return null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterInventory, setFilterInventory] = useState('ALL');
  const [filterVisibility, setFilterVisibility] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isTaggingBulk, setIsTaggingBulk] = useState(false);
  const [tagProgress, setTagProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [parsedImportProducts, setParsedImportProducts] = useState(null);
  const [selectedImportIndices, setSelectedImportIndices] = useState(new Set());
  const [selectedExportIds, setSelectedExportIds] = useState(new Set());
  const [viewStatsProduct, setViewStatsProduct] = useState(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ total: 0, current: 0 });
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
        setSelectedExportIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExportIds.size === 0) return;
    setIsDeletingBulk(true);
    try {
      const idsToDelete = Array.from(selectedExportIds);
      const res = await fetch('/api/products/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: idsToDelete })
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => !selectedExportIds.has(p.id)));
        setSelectedExportIds(new Set());
        setDeleteConfirm(null);
      } else {
        throw new Error('Failed to delete selected items');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Error deleting items');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkVisibility = async (isVisible) => {
    if (selectedExportIds.size === 0) return;
    setIsTogglingVisibility(true);
    try {
      const idsToUpdate = Array.from(selectedExportIds);
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: idsToUpdate, isVisible })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => 
          selectedExportIds.has(p.id) ? { ...p, isVisible } : p
        ));
        setSelectedExportIds(new Set());
      } else {
        throw new Error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Bulk visibility error:', error);
      alert('Error updating visibility');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleBulkTagEffects = async () => {
    if (selectedExportIds.size === 0) return;
    setIsTaggingBulk(true);
    setTagProgress({ current: 0, total: selectedExportIds.size });
    try {
      const idsToUpdate = Array.from(selectedExportIds);
      let successCount = 0;

      for (let i = 0; i < idsToUpdate.length; i++) {
        const id = idsToUpdate[i];
        try {
          const res = await fetch('/api/admin/products/bulk-auto-effects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids: [id] })
          });
          if (res.ok) successCount++;
        } catch (e) {
          console.error("Failed to tag item", id, e);
        }
        setTagProgress({ current: i + 1, total: idsToUpdate.length });
      }

      await fetchProducts();
      setSelectedExportIds(new Set());
      alert(`Successfully tagged ${successCount} products with Moods!`);
    } catch (error) {
      console.error('Bulk tag error:', error);
      alert('Error updating effects: ' + error.message);
    } finally {
      setIsTaggingBulk(false);
      setTagProgress(null);
    }
  };

  const handleToggleVisibility = async (id, currentVisibility) => {
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: [id], isVisible: !currentVisibility })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isVisible: !currentVisibility } : p));
      }
    } catch (error) {
      console.error('Toggle visibility error:', error);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: [id], featured: !currentFeatured })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !currentFeatured } : p));
      }
    } catch (error) {
      console.error('Toggle featured error:', error);
    }
  };

  const handleBulkBackfill = async () => {
    const productsToBackfill = products.filter(p => !p.description || p.description.trim() === '');
    if (productsToBackfill.length === 0) {
      alert('All products already have descriptions!');
      return;
    }

    if (!confirm(`Are you sure you want to backfill descriptions for ${productsToBackfill.length} products? This might take a while.`)) {
      return;
    }

    setIsBackfilling(true);
    setBackfillProgress({ total: productsToBackfill.length, current: 0 });

    for (let i = 0; i < productsToBackfill.length; i++) {
      const p = productsToBackfill[i];
      setBackfillProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const aiRes = await fetch('/api/products/generate-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: p.name, category: p.category, weight: p.weight })
        });

        if (aiRes.ok) {
          const { description } = await aiRes.json();
          if (description) {
            const putRes = await fetch(`/api/products/${p.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ description })
            });
            if (putRes.ok) {
              const updated = await putRes.json();
              setProducts(prev => prev.map(prod => prod.id === updated.id ? updated : prod));
            }
          }
        }
      } catch (err) {
        console.error(`Failed to backfill description for ${p.name}:`, err);
      }
    }

    setIsBackfilling(false);
    alert('Finished backfilling descriptions!');
  };

  const handleSave = (saved) => {
    if (editProduct) {
      setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      setProducts((prev) => [saved, ...prev]);
    }
    setShowForm(false);
    setEditProduct(null);
  };

  const handleExportCSV = () => {
    const productsToExport = selectedExportIds.size > 0 
      ? products.filter(p => selectedExportIds.has(p.id))
      : products;

    const headers = ['id', 'name', 'category', 'price', 'weight', 'description', 'images', 'stock', 'featured', 'isVisible'];
    const rows = productsToExport.map(p => {
      return headers.map(h => {
        let val = p[h];
        if (h === 'images') {
          try {
            const parsed = JSON.parse(val || '[]');
            val = parsed.join(', ');
          } catch {
            val = '';
          }
        }
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const parsedProducts = parseCSV(text);
        
        if (parsedProducts.length === 0) {
          throw new Error('CSV file is empty or invalid.');
        }

        setParsedImportProducts(parsedProducts);
        setSelectedImportIndices(new Set(parsedProducts.map((_, i) => i)));
      } catch (error) {
        setImportResult({ error: error.message });
      } finally {
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      const productsToImport = parsedImportProducts.filter((_, i) => selectedImportIndices.has(i));
      if (productsToImport.length === 0) {
        throw new Error("No products selected for import.");
      }
      
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productsToImport),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportResult(data);
      fetchProducts(); // Refresh products
      setParsedImportProducts(null); // Close modal
    } catch (error) {
      setImportResult({ error: error.message });
      setParsedImportProducts(null);
    } finally {
      setIsImporting(false);
    }
  };

  const parseCSV = (str) => {
    const result = [];
    const lines = str.split(/\r?\n/);
    if (lines.length < 2) return result;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let inQuote = false;
      let val = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuote && line[j+1] === '"') {
            val += '"';
            j++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === ',' && !inQuote) {
          values.push(val);
          val = '';
        } else {
          val += char;
        }
      }
      values.push(val);
      
      const obj = {};
      headers.forEach((h, index) => {
        obj[h] = values[index] !== undefined ? values[index] : '';
      });
      result.push(obj);
    }
    return result;
  };

  const filtered = products.filter((p) => {
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (filterInventory === 'IN_STOCK' && p.stock <= 0) return false;
    if (filterInventory === 'OUT_OF_STOCK' && p.stock > 0) return false;
    
    if (filterVisibility === 'VISIBLE' && !p.isVisible) return false;
    if (filterVisibility === 'HIDDEN' && p.isVisible) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterInventory, filterVisibility, search]);

  const stockColor = (stock) => {
    if (stock === 0) return 'text-red-400 bg-red-500/10';
    if (stock <= 5) return 'text-yellow-400 bg-yellow-500/10';
    if (stock <= 10) return 'text-orange-400 bg-orange-500/10';
    return 'text-pc-green bg-pc-green/10';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-pc-muted">Loading products...</div></div>;
  }

  return (
    <div className="animate-fade-in">
      <Suspense fallback={null}>
        <ProductsSearchParamsHandler onParams={(params) => {
          const querySearch = params.get('search');
          if (querySearch) {
            setSearch(querySearch);
          }
        }} />
      </Suspense>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Products</h1>
          <p className="text-pc-muted">{products.length} total products</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedExportIds.size > 0 && (
            <>
              <button 
                onClick={() => handleBulkVisibility(false)} 
                className="btn-secondary whitespace-nowrap"
                disabled={isTogglingVisibility}
              >
                Hide Selected
              </button>
              <button 
                onClick={() => handleBulkVisibility(true)} 
                className="btn-secondary whitespace-nowrap"
                disabled={isTogglingVisibility}
              >
                Show Selected
              </button>
              <button
                onClick={handleBulkTagEffects}
                disabled={isTaggingBulk}
                className="btn-secondary text-pc-gold border-pc-gold/30 hover:bg-pc-gold/10 whitespace-nowrap"
              >
                {isTaggingBulk ? (tagProgress ? `Analyzing... (${tagProgress.current}/${tagProgress.total})` : 'Analyzing...') : '✨ Auto-Tag Mood'}
              </button>
              <button 
                onClick={() => setDeleteConfirm('bulk')} 
                className="btn-danger whitespace-nowrap"
              >
                Delete Selected ({selectedExportIds.size})
              </button>
            </>
          )}
          <button onClick={handleExportCSV} className="btn-secondary whitespace-nowrap">
            {selectedExportIds.size > 0 ? `Export Selected (${selectedExportIds.size})` : 'Export All CSV'}
          </button>
          <label className={`btn-secondary whitespace-nowrap cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
            {isImporting ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} />
          </label>
          <button 
            onClick={handleBulkBackfill} 
            disabled={isBackfilling}
            className="btn-secondary text-pc-green border-pc-green/30 hover:bg-pc-green/10 whitespace-nowrap"
          >
            {isBackfilling ? `✨ Generating ${backfillProgress.current}/${backfillProgress.total}...` : '✨ AI Backfill'}
          </button>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn-primary" id="add-product-btn">
            + Add Product
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-4 mb-6 rounded-xl border ${importResult.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-pc-green/10 border-pc-green/30 text-pc-green'} flex justify-between items-start`}>
          <div>
            <h4 className="font-bold mb-1">{importResult.error ? 'Import Failed' : 'Import Complete'}</h4>
            {importResult.error ? (
              <p className="text-sm">{importResult.error}</p>
            ) : (
              <div className="text-sm">
                <p>Created: {importResult.created} products</p>
                <p>Updated: {importResult.updated} products</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-red-400">
                    <p className="font-semibold">Errors ({importResult.errors.length}):</p>
                    <ul className="list-disc pl-4 mt-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="text-current opacity-50 hover:opacity-100 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-4">
        <div className="flex-1 relative min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select-field flex-1 sm:flex-none sm:w-auto min-w-[140px]">
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select value={filterInventory} onChange={(e) => setFilterInventory(e.target.value)} className="select-field flex-1 sm:flex-none sm:w-auto min-w-[140px]">
            <option value="ALL">All Inventory</option>
            <option value="IN_STOCK">In stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
          <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="select-field flex-1 sm:flex-none sm:w-auto min-w-[140px]">
            <option value="ALL">All Visibility</option>
            <option value="VISIBLE">Shown in store</option>
            <option value="HIDDEN">Hidden from store</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pc-border">
                <th className="p-4 w-12 text-left">
                  <input 
                    type="checkbox"
                    className="modern-checkbox"
                    checked={selectedExportIds.size === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedExportIds(new Set(filtered.map(p => p.id)));
                      else setSelectedExportIds(new Set());
                    }}
                  />
                </th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Product</th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Category</th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Price</th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Stock</th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Visible</th>
                <th className="text-left p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Featured</th>
                <th className="text-right p-4 text-pc-muted text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="border-b border-pc-border/50 hover:bg-pc-card/50 transition-colors">
                  <td className="p-4">
                    <input 
                      type="checkbox"
                      className="modern-checkbox"
                      checked={selectedExportIds.has(product.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedExportIds);
                        if (e.target.checked) newSet.add(product.id);
                        else newSet.delete(product.id);
                        setSelectedExportIds(newSet);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-pc-border">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm">{product.name}</p>
                          {product.isVisible === false && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-smoke text-pc-muted">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-pc-muted text-xs">{product.weight}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={
                      product.category === 'FLOWER' || product.category === 'flower' ? 'badge-hybrid' :
                      product.category === 'EDIBLE' || product.category === 'edible' ? 'badge-edible' :
                      'badge-indica'
                    }>
                      {categories.find(c => c.slug === product.category)?.name || product.category}
                    </span>
                  </td>
                  <td className="p-4 text-white font-semibold text-sm">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${stockColor(product.stock)}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="modern-toggle" 
                        checked={product.isVisible} 
                        onChange={() => handleToggleVisibility(product.id, product.isVisible)} 
                      />
                    </label>
                  </td>
                  <td className="p-4">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="modern-toggle" 
                        checked={product.featured} 
                        onChange={() => handleToggleFeatured(product.id, product.featured)} 
                      />
                    </label>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setViewStatsProduct(product)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-pc-muted hover:text-white hover:bg-pc-card border border-pc-border transition-all"
                      >
                        Stats
                      </button>
                      <button
                        onClick={() => { setEditProduct(product); setShowForm(true); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-pc-muted hover:text-white hover:bg-pc-card border border-pc-border transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-pc-muted">
            <p>No products found</p>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 glass-card p-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-pc-dark border border-pc-border text-white rounded-lg disabled:opacity-50 hover:bg-pc-border transition-colors font-medium text-sm"
          >
            Previous
          </button>
          <span className="text-pc-muted text-sm font-medium">
            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-pc-dark border border-pc-border text-white rounded-lg disabled:opacity-50 hover:bg-pc-border transition-colors font-medium text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editProduct}
          token={token}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditProduct(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2">Delete {deleteConfirm === 'bulk' ? `${selectedExportIds.size} Products` : 'Product'}?</h3>
            <p className="text-pc-muted text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={deleteConfirm === 'bulk' ? handleBulkDelete : () => handleDelete(deleteConfirm)} 
                className="btn-danger flex-1"
                disabled={isDeletingBulk}
              >
                {isDeletingBulk ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" disabled={isDeletingBulk}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {parsedImportProducts && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card p-6 max-w-4xl w-full flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-2">Select Products to Import</h3>
            <p className="text-pc-muted text-sm mb-4">Choose which products from the CSV file you want to update or create.</p>
            
            <div className="flex-1 overflow-auto border border-pc-border rounded-xl bg-pc-dark mb-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-pc-dark z-10 shadow-sm border-b border-pc-border">
                  <tr>
                    <th className="p-3 text-left w-12">
                      <input 
                        type="checkbox" 
                        className="modern-checkbox"
                        checked={selectedImportIndices.size === parsedImportProducts.length && parsedImportProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedImportIndices(new Set(parsedImportProducts.map((_, i) => i)));
                          else setSelectedImportIndices(new Set());
                        }}
                      />
                    </th>
                    <th className="p-3 text-left text-pc-muted uppercase tracking-wider text-xs">Name</th>
                    <th className="p-3 text-left text-pc-muted uppercase tracking-wider text-xs">Category</th>
                    <th className="p-3 text-left text-pc-muted uppercase tracking-wider text-xs">Price</th>
                    <th className="p-3 text-left text-pc-muted uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedImportProducts.map((p, index) => {
                    const isSelected = selectedImportIndices.has(index);
                    const isUpdate = p.id && products.some(existing => existing.id === p.id);
                    return (
                      <tr key={index} className="border-b border-pc-border/30 hover:bg-pc-card/50">
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            className="modern-checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedImportIndices);
                              if (e.target.checked) newSet.add(index);
                              else newSet.delete(index);
                              setSelectedImportIndices(newSet);
                            }}
                          />
                        </td>
                        <td className="p-3 font-semibold text-white">{p.name || 'Unnamed'}</td>
                        <td className="p-3">{p.category}</td>
                        <td className="p-3">${parseFloat(p.price || 0).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${isUpdate ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isUpdate ? 'Update' : 'Create'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setParsedImportProducts(null)} className="btn-secondary" disabled={isImporting}>Cancel</button>
              <button onClick={handleConfirmImport} className="btn-primary" disabled={isImporting || selectedImportIndices.size === 0}>
                {isImporting ? 'Importing...' : `Import ${selectedImportIndices.size} Products`}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewStatsProduct && (
        <InventoryStatsModal
          productId={viewStatsProduct.id}
          productName={viewStatsProduct.name}
          onClose={() => setViewStatsProduct(null)}
        />
      )}
    </div>
  );
}
