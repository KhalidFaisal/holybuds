'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider, useCart } from '@/components/CartProvider';
import { getEffectColorClass } from '@/lib/colors';

// Removed StrainBadge
function ProductDetails({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [fbtProducts, setFbtProducts] = useState([]);
  
  useEffect(() => {
    fetch(`/api/products/${product.id}/fbt`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFbtProducts(data);
      })
      .catch(console.error);
  }, [product.id]);

  const images = (() => {
    try {
      const parsed = JSON.parse(product.images || '[]');
      if (parsed.length > 0) return parsed;
    } catch {}
    return product.image ? [product.image] : [];
  })();
  const [mainImage, setMainImage] = useState(images.length > 0 ? images[0] : null);

  const handleAdd = () => {
    addItem(product, quantity);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <Navbar />
      <CartDrawer />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/menu" className="inline-flex items-center gap-2 text-pc-green hover:text-pc-green-light transition-colors mb-8 font-medium">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Menu
        </Link>

        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            {/* Image Section */}
            <div className="lg:col-span-2 flex flex-col bg-pc-dark border-r border-pc-border">
              <div className="relative aspect-square w-full bg-pc-card/50 border-b border-pc-border">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                    <svg className="w-24 h-24 text-pc-border" viewBox="0 0 24 24" fill="currentColor">
                      {product.category === 'FLOWER' ? (
                        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                      ) : (
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      )}
                    </svg>
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-pc-gold text-black text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
                    Featured
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 border-t border-pc-border bg-pc-card">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        mainImage === img ? 'border-pc-green opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-pc-border'
                      }`}
                    >
                      <Image src={img} alt={`${product.name} ${i+1}`} fill sizes="20vw" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="lg:col-span-3 p-8 md:p-12 flex flex-col">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={product.category === 'FLOWER' ? 'badge-hybrid' : 'badge-edible'}>
                  {product.category === 'FLOWER' ? 'Flowers' : (product.category?.charAt(0)?.toUpperCase() + product.category?.slice(1)?.toLowerCase()) || 'Product'}
                </span>
                
                {(() => {
                  try {
                    const parsedEffects = JSON.parse(product.effects || '[]');
                    if (parsedEffects.length > 0) {
                      return parsedEffects.map(effect => (
                        <span key={effect} className={`${getEffectColorClass(effect)} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
                          {effect}
                        </span>
                      ));
                    }
                  } catch (e) {}
                  return null;
                })()}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {product.name}
              </h1>

              {product.weight && (
                <div className="flex flex-wrap items-center gap-6 mb-8 text-lg border-b border-pc-border pb-8">
                  <span className="text-pc-muted font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25v19.5m0 0l-6-6m6 6l6-6" /></svg>
                    {product.weight}
                  </span>
                </div>
              )}

              {product.description && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-white mb-3">About this product</h3>
                  <p className="text-pc-muted text-lg leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mt-auto">
                {/* Discount Badge */}
                {product.eligibleDiscountNames && product.eligibleDiscountNames.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {product.eligibleDiscountNames.map(name => (
                      <span key={name} className="bg-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
                  <div className="w-full sm:w-auto">
                    <span className="block text-pc-muted mb-1 text-sm">Price</span>
                    {product.calculatedDiscountPrice && product.calculatedDiscountPrice < product.price ? (
                      <div className="flex flex-col">
                        <span className="text-lg text-pc-muted line-through decoration-red-500/80">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-4xl font-black text-emerald-400">
                          ${product.calculatedDiscountPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-black text-white">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Quantity Selector */}
                    {product.stock > 0 && (
                      <div className="flex items-center bg-pc-dark rounded-xl border border-pc-border overflow-hidden">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-3 text-pc-muted hover:text-white hover:bg-white/5 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 font-semibold text-lg text-white w-12 text-center">
                          {quantity}
                        </span>
                        <button 
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="px-4 py-3 text-pc-muted hover:text-white hover:bg-white/5 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleAdd}
                      disabled={product.stock === 0}
                      className="btn-primary text-lg px-8 py-4 w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
                    >
                      {product.stock === 0 ? 'Sold Out' : (
                        <>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stock Warning */}
                {product.stock <= 5 && product.stock > 0 && (
                  <p className="text-red-400 text-sm font-semibold mt-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Only {product.stock} left in stock - order soon!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        {fbtProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Frequently Bought Together
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fbtProducts.map(p => (
                <Link href={`/product/${p.id}`} key={p.id} className="glass-card p-4 hover:border-pc-green transition-colors group flex flex-col">
                  <div className="aspect-square bg-pc-smoke rounded-lg overflow-hidden relative mb-4">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-pc-border" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-white text-sm line-clamp-2 mb-1 group-hover:text-pc-green transition-colors">{p.name}</h4>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-pc-green font-bold text-lg">${p.calculatedDiscountPrice || p.price}</span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addItem(p, 1);
                        }}
                        className="bg-pc-dark hover:bg-pc-border text-white text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductClient({ product }) {
  return (
    <CartProvider>
      <ProductDetails product={product} />
    </CartProvider>
  );
}
