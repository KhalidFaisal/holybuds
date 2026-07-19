'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { CartProvider } from '@/components/CartProvider';
import Link from 'next/link';

export default function MenuClient({ products, categories, initialCategory, initialSearch }) {
  const [category, setCategory] = useState(initialCategory || 'ALL');
  const [search, setSearch] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState('newest');
  const [effectFilter, setEffectFilter] = useState('ALL');
  
  const AVAILABLE_EFFECTS = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

  // Sync state with URL params when navigating between categories
  useEffect(() => {
    setCategory(initialCategory || 'ALL');
  }, [initialCategory]);

  useEffect(() => {
    setSearch(initialSearch || '');
  }, [initialSearch]);

  const filtered = useMemo(() => {
    let result = [...products];

    // Category filter
    if (category !== 'ALL') {
      result = result.filter((p) => p.category === category);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Effect filter
    if (effectFilter !== 'ALL') {
      result = result.filter(p => {
        try {
          const parsedEffects = JSON.parse(p.effects || '[]');
          return parsedEffects.includes(effectFilter);
        } catch {
          return false;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // newest first (already sorted from server)
        break;
    }

    return result;
  }, [products, category, search, sortBy, effectFilter]);

  const isFullMenuPage = !initialCategory || initialCategory === 'ALL';
  const activeCategoryObj = categories?.find(c => c.slug === category);
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : 'Our Menu';

  return (
    <CartProvider>
      <Navbar />
      <CartDrawer />

      <main className="pt-20 md:pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title">{pageTitle}</h1>
            <p className="section-subtitle">Browse our curated selection of premium products</p>
          </div>

          {/* Filters Bar */}
          <div className="glass-card p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pc-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                  id="menu-search"
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                {/* Category Dropdown */}
                {isFullMenuPage && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="select-field flex-1 md:w-auto min-w-[140px]"
                    id="category-select"
                  >
                    <option value="ALL">All Categories</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select-field flex-1 md:w-auto min-w-[140px]"
                  id="sort-select"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="name">Name: A → Z</option>
                </select>

                {/* Mood Dropdown (Only for Flower) */}
                {category === 'FLOWER' && (
                  <select
                    value={effectFilter}
                    onChange={(e) => setEffectFilter(e.target.value)}
                    className="select-field flex-1 md:w-auto min-w-[140px]"
                    id="mood-select"
                  >
                    <option value="ALL">All Moods</option>
                    {AVAILABLE_EFFECTS.map(effect => (
                      <option key={effect} value={effect}>
                        {effect}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-pc-muted text-sm mb-6">
            Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>

          {/* Product Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-pc-border mb-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-pc-muted">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-pc-border py-8 text-center text-pc-muted/60 text-xs">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-2 uppercase tracking-widest font-semibold text-pc-muted">Disclaimer:</p>
          <p className="mb-4">
            Our products are not FDA approved to diagnose, treat, cure, or prevent any disease. All items comply with the U.S. Farm Bill and contain less than 0.3% THC. Intended for adult use only. THCa and other hemp-derived THC products are not shipped to states where restricted by law. Full disclaimer in <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Service</Link>.
          </p>
          <p>© {new Date().getFullYear()} Holybuds. All rights reserved.</p>
        </div>
      </footer>
    </CartProvider>
  );
}
