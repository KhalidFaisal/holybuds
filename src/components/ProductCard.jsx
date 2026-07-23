'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getEffectColorClass } from '@/lib/colors';
import { useCart } from './CartProvider';
import CannabisIcon from './icons/CannabisIcon';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('holybuds_favorites') || '[]');
      setIsFavorite(favs.includes(product.id));
    } catch(e) {}
  }, [product.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs = JSON.parse(localStorage.getItem('holybuds_favorites') || '[]');
      let newFavs;
      if (favs.includes(product.id)) {
        newFavs = favs.filter(id => id !== product.id);
        setIsFavorite(false);
      } else {
        newFavs = [...favs, product.id];
        setIsFavorite(true);
      }
      localStorage.setItem('holybuds_favorites', JSON.stringify(newFavs));
      window.dispatchEvent(new Event('holybuds_favorites_updated'));
    } catch(e) {}
  };

  return (
    <div className="glass-card-hover overflow-hidden group flex flex-col h-full" id={`product-${product.id}`}>
      {/* Image wrapped in Link */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-pc-dark block">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {product.category === 'FLOWER' ? (
              <CannabisIcon className="w-16 h-16 text-pc-green opacity-50" />
            ) : (
              <svg
                className="w-16 h-16 text-pc-border"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-2 right-2 z-10 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors pointer-events-auto group/fav"
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <svg className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white/80 group-hover/fav:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Badges container */}
        <div className="absolute top-2 left-2 right-12 flex justify-between items-start gap-1 pointer-events-none">
          {product.featured ? (
            <div className="bg-pc-gold text-black text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shrink-1 min-w-0">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
              <span className="truncate">Featured</span>
            </div>
          ) : <div />}

          {/* Stock warning */}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="bg-red-500/90 text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0 text-center pointer-events-none">
              Only {product.stock} left
            </div>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/product/${product.id}`} className="hover:underline">
            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-pc-green-light transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Weight */}
        {product.weight && (
          <div className="flex items-center gap-3 mb-3 text-sm">
            <span className="text-pc-muted">
              {product.weight}
            </span>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-pc-muted text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Effects Badges */}
        {(() => {
          let parsedEffects = [];
          try {
            parsedEffects = JSON.parse(product.effects || '[]');
          } catch (e) {}

          if (parsedEffects.length > 0) {
            return (
              <div className="mb-3 flex flex-wrap gap-1">
                {parsedEffects.map(effect => (
                  <span key={effect} className={`${getEffectColorClass(effect)} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
                    {effect}
                  </span>
                ))}
              </div>
            );
          }
          return null;
        })()}

        {/* Discount Badge */}
        {product.eligibleDiscountNames && product.eligibleDiscountNames.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {product.eligibleDiscountNames.map(name => (
              <span key={name} className="bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30">
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-auto pt-2 border-t border-pc-border/50">
          <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:gap-0">
            {product.calculatedDiscountPrice && product.calculatedDiscountPrice < product.price ? (
              <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
                <span className="text-xs sm:text-sm text-pc-muted line-through decoration-red-500/80">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400">
                  ${product.calculatedDiscountPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg sm:text-2xl font-black text-white">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="btn-primary w-full sm:w-auto text-sm px-3 py-1.5 sm:px-4 sm:py-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-pc-green disabled:hover:shadow-none whitespace-nowrap shrink-0"
            id={`add-to-cart-${product.id}`}
          >
            {product.stock === 0 ? 'Sold Out' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
