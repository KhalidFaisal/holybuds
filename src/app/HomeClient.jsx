'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { CartProvider } from '@/components/CartProvider';
import CannabisIcon from '@/components/icons/CannabisIcon';

import { useState, useEffect, useRef } from 'react';

function BannerCarousel({ banners }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) return <HeroSection />;

  return (
    <section className="relative w-full max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 mt-16 md:mt-20 group">
      <div className="grid rounded-none md:rounded-2xl overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`col-start-1 row-start-1 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Link href={banner.link || '#'} className="block w-full h-full cursor-pointer">
              <div className="md:hidden block w-full h-full">
                 <Image src={banner.mobileImage || banner.desktopImage} alt={banner.title} width={800} height={800} className="w-full h-auto object-contain" priority={index === 0} />
               </div>
               <div className="hidden md:block w-full h-full">
                 <Image src={banner.desktopImage || banner.mobileImage} alt={banner.title} width={1600} height={600} className="w-full h-auto object-contain" priority={index === 0} />
               </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Carousel Controls */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentIndex ? 'bg-pc-green scale-125' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]" />

      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pc-green/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-pc-gold/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-pc-green/20 rounded-full animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-pc-gold/15 rounded-full animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fade-in-up">
        {/* Logo Image */}
        <div className="mb-8">
          <Image 
            src="/logo.png" 
            alt="Holybuds" 
            width={1200}
            height={400}
            className="w-[80%] max-w-3xl mx-auto drop-shadow-[0_0_30px_rgba(152,227,44,0.3)] animate-float h-auto"
            priority
          />
        </div>

        <p className="text-xl md:text-2xl text-pc-green font-bold tracking-widest uppercase mb-8 text-gradient">
          PREMIUM CANNABIS DISPENSARY
        </p>

        <p className="text-lg text-pc-muted/80 max-w-xl mx-auto mb-10">
          Holybuds is your ultimate destination for premium cannabis.<br/>
          Elevate your experience with our carefully curated selection.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/menu" className="btn-primary text-lg px-10 py-4" id="shop-now-btn">
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductSection({ title, subtitle, products, viewAllHref, icon }) {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 800 : 400;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative group">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="section-title flex items-center gap-3">
            <span>{icon}</span> {title}
          </h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href={viewAllHref}
            className="text-pc-green hover:text-pc-green-light font-medium text-sm transition-colors"
          >
            View All →
          </Link>
        </div>
      </div>

      <div className="relative group/slider">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[180px] sm:w-[220px] lg:w-[260px] shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('left')} 
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full bg-pc-dark/90 backdrop-blur-sm border border-pc-border shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:text-white hover:border-pc-green/50 text-pc-muted opacity-0 group-hover/slider:opacity-100 transition-all duration-300"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button 
          onClick={() => scroll('right')} 
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full bg-pc-dark/90 backdrop-blur-sm border border-pc-border shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:text-white hover:border-pc-green/50 text-pc-muted opacity-0 group-hover/slider:opacity-100 transition-all duration-300"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="text-center mt-8 sm:hidden">
        <Link href={viewAllHref} className="btn-secondary text-sm">
          View All →
        </Link>
      </div>
    </section>
  );
}

function ShopByCategorySection({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="section-title flex items-center gap-3">
            <svg className="w-8 h-8 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Shop by Category
          </h2>
          <p className="section-subtitle">Explore our wide selection of products</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/menu?category=${cat.slug}`}
            className="group block relative rounded-2xl overflow-hidden aspect-square bg-pc-smoke border border-pc-border hover:border-pc-green/50 transition-colors"
          >
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pc-dark">
                <span className="text-pc-muted font-medium">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-md">{cat.name}</h3>
              <p className="text-pc-green text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">Shop Now →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer({ categories }) {
  return (
    <footer className="border-t border-pc-border bg-pc-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Holybuds" width={400} height={100} className="h-10 w-auto object-contain" />
            </div>
            <p className="text-pc-muted text-sm">
              Holybuds is your ultimate destination for premium cannabis. Elevate your experience with our carefully curated selection.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <div className={`grid ${categories && categories.length >= 5 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-4 gap-y-2`}>
              <Link href="/menu" className="block text-pc-muted text-sm hover:text-white transition-colors">Full Menu</Link>
              <Link href="/faq" className="block text-pc-muted text-sm hover:text-white transition-colors">FAQ</Link>
              {categories?.map(cat => (
                <Link key={cat.id} href={`/menu?category=${cat.slug}`} className="block text-pc-muted text-sm hover:text-white transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-white mb-4">Info</h4>
            <div className="space-y-4 text-pc-muted text-sm">
              <p className="flex items-start gap-3">
                <svg className="w-5 h-5 text-pc-green shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>
                  Sun-Thu: 10 AM – 10 PM <br />
                  Fri-Sat: 10 AM – 12 AM
                </span>
              </p>
              
              <a href="https://instagram.com/holy_buds" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-[#E1306C] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span>@holy_buds</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-pc-border mt-8 pt-8 text-center text-pc-muted/60 text-xs">
          <div className="max-w-4xl mx-auto mb-4">
            <p className="mb-2 uppercase tracking-widest font-semibold text-pc-muted">Disclaimer:</p>
            <p>
              Our products are not FDA approved to diagnose, treat, cure, or prevent any disease. All items comply with the U.S. Farm Bill and contain less than 0.3% THC. Intended for adult use only. THCa and other hemp-derived THC products are not shipped to states where restricted by law. Full disclaimer in <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Service</Link>.
            </p>
          </div>
          <p>© {new Date().getFullYear()} Holybuds. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomeClient({ deals, staffPicks, newArrivals, bestSellers, categories, banners }) {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    // Attempt to load recent products from localStorage
    const loadRecentProducts = () => {
      try {
        const orders = JSON.parse(localStorage.getItem('holybuds_recent_orders') || '[]');
        const productMap = new Map();
        orders.forEach(o => {
          o.items?.forEach(i => {
            if (i.product && !productMap.has(i.productId)) {
              productMap.set(i.productId, i.product);
            }
          });
        });
        setRecentProducts(Array.from(productMap.values()).slice(0, 8));
      } catch (e) {
        console.error(e);
      }
    };

    // Defer state update to avoid synchronous cascade warning
    const timeoutId = setTimeout(loadRecentProducts, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <CartProvider>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">
        <BannerCarousel banners={banners} />

        <div className="space-y-4">
          <ProductSection 
            title="Today's Deals" 
            subtitle="Don't miss out on these limited-time offers" 
            products={deals} 
            viewAllHref="/menu" 
            icon={<svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.866 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>}
          />
          
          <ProductSection 
            title="Best Sellers" 
            subtitle="Our most popular products" 
            products={bestSellers} 
            viewAllHref="/menu" 
            icon={<svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" /></svg>}
          />

          {recentProducts.length > 0 && (
            <ProductSection 
              title="Order Again" 
              subtitle="Quickly reorder your favorites" 
              products={recentProducts} 
              viewAllHref="/account" 
              icon={<svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>}
            />
          )}

          <ProductSection 
            title="New Arrivals" 
            subtitle="The latest additions to our collection" 
            products={newArrivals} 
            viewAllHref="/menu" 
            icon={<svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>}
          />

          <ProductSection 
            title="Staff Picks" 
            subtitle="Hand-selected by our experts" 
            products={staffPicks} 
            viewAllHref="/menu" 
            icon={<svg className="w-8 h-8 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
          />
        </div>

        {/* Shop By Category */}
        <ShopByCategorySection categories={categories} />

        {/* CTA Banner */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center glass-card p-10 md:p-16 glow-emerald">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gradient">
              Ready to elevate your experience?
            </h2>
            <p className="text-pc-muted text-lg mb-8">
              Browse our full menu and place your order for pickup.
            </p>
            <Link href="/menu" className="btn-primary text-lg px-12 py-4">
              View Full Menu
            </Link>
          </div>
        </section>
      </main>

      <Footer categories={categories} />
    </CartProvider>
  );
}
