'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { CartProvider } from '@/components/CartProvider';
import CannabisIcon from '@/components/icons/CannabisIcon';

import { useState, useEffect } from 'react';

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
  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="section-title flex items-center gap-3">
            <span>{icon}</span> {title}
          </h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="text-pc-green hover:text-pc-green-light font-medium text-sm transition-colors hidden sm:block"
        >
          View All →
        </Link>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {products.map((product) => (
          <div key={product.id} className="w-[180px] sm:w-[220px] lg:w-[260px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
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
          <h2 className="section-title">Shop by Category</h2>
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
            <div className="space-y-2 text-pc-muted text-sm">
              <p className="flex items-start gap-3">
                <svg className="w-5 h-5 text-pc-green shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>
                  Sun-Thu: 10 AM – 10 PM <br />
                  Fri-Sat: 10 AM – 12 AM
                </span>
              </p>
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
    </footer>
  );
}

export default function HomeClient({ deals, staffPicks, newArrivals, bestSellers, categories, banners }) {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    // Attempt to load recent products from localStorage
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
            icon="🔥" 
          />
          
          <ProductSection 
            title="Best Sellers" 
            subtitle="Our most popular products" 
            products={bestSellers} 
            viewAllHref="/menu" 
            icon="⭐" 
          />

          {recentProducts.length > 0 && (
            <ProductSection 
              title="Order Again" 
              subtitle="Quickly reorder your favorites" 
              products={recentProducts} 
              viewAllHref="/account" 
              icon="⚡" 
            />
          )}

          <ProductSection 
            title="New Arrivals" 
            subtitle="Fresh drops and latest additions" 
            products={newArrivals} 
            viewAllHref="/menu" 
            icon="🆕" 
          />

          <ProductSection 
            title="Staff Picks" 
            subtitle="Hand-selected by our team" 
            products={staffPicks} 
            viewAllHref="/menu" 
            icon="🏷" 
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
