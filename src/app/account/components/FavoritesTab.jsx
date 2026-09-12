'use client';

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function FavoritesTab({ favorites = [], loading = false, onClearFavorites }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-4 rounded-2xl animate-pulse space-y-3">
            <div className="w-full aspect-square bg-pc-smoke/40 rounded-xl" />
            <div className="h-4 bg-pc-smoke/40 rounded w-3/4" />
            <div className="h-4 bg-pc-smoke/40 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20 text-rose-400">
          <svg className="w-8 h-8 fill-rose-500 text-rose-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No favorites saved yet</h3>
        <p className="text-xs text-pc-muted mb-6 leading-relaxed">
          Tap the heart icon on any flower, edible, or vape while browsing our menu to save it here for fast reordering.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <Link href="/menu?category=flowers" className="text-xs px-3 py-1.5 bg-pc-dark hover:bg-pc-card text-pc-muted hover:text-white rounded-lg border border-pc-border transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9z" />
            </svg>
            Flowers
          </Link>
          <Link href="/menu?category=edibles" className="text-xs px-3 py-1.5 bg-pc-dark hover:bg-pc-card text-pc-muted hover:text-white rounded-lg border border-pc-border transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Edibles
          </Link>
          <Link href="/menu?category=vapes" className="text-xs px-3 py-1.5 bg-pc-dark hover:bg-pc-card text-pc-muted hover:text-white rounded-lg border border-pc-border transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18a9 9 0 0 1 9 9m-9-9a9 9 0 0 0-9 9" />
            </svg>
            Vapes
          </Link>
          <Link href="/menu?category=prerolls" className="text-xs px-3 py-1.5 bg-pc-dark hover:bg-pc-card text-pc-muted hover:text-white rounded-lg border border-pc-border transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            </svg>
            Pre-Rolls
          </Link>
        </div>

        <Link href="/menu" className="btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-5">
          Browse All Products
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
        <p className="text-xs text-pc-muted">
          Showing <strong className="text-white">{favorites.length}</strong> saved product{favorites.length !== 1 ? 's' : ''}
        </p>

        {onClearFavorites && (
          <button
            onClick={onClearFavorites}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {favorites.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
