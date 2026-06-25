'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import CannabisIcon from './icons/CannabisIcon';

// Removed StrainBadge
export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <div className="glass-card-hover overflow-hidden group flex flex-col h-full" id={`product-${product.id}`}>
      {/* Image wrapped in Link */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-pc-dark block">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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

        {/* Badges container */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1 pointer-events-none">
          {product.featured ? (
            <div className="bg-pc-gold text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shrink-1 min-w-0">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
              <span className="truncate">Featured</span>
            </div>
          ) : <div />}

          {/* Stock warning */}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="bg-red-500/90 text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0 text-center">
              Only {product.stock} left
            </div>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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
