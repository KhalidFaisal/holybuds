'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartProvider';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

function SearchDropdown({ query, onSelect }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.slice(0, 5)); // show top 5
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query || query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-pc-dark border border-pc-border rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
      {loading ? (
        <div className="p-4 text-center text-pc-muted text-sm">Searching...</div>
      ) : results.length > 0 ? (
        <div className="flex flex-col">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              onClick={onSelect}
              className="flex items-center gap-3 p-3 hover:bg-pc-card transition-colors border-b border-pc-border/50 last:border-0"
            >
              {product.image ? (
                <Image src={product.image} alt={product.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover bg-pc-smoke" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-pc-smoke flex items-center justify-center">
                  <svg className="w-5 h-5 text-pc-muted" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                <p className="text-pc-muted text-xs truncate">{product.category}</p>
              </div>
              <p className="text-pc-green text-sm font-bold">${product.calculatedDiscountPrice || product.price}</p>
            </Link>
          ))}
          <Link
            href={`/menu?search=${encodeURIComponent(query)}`}
            onClick={onSelect}
            className="p-3 text-center text-sm font-bold text-pc-green hover:bg-pc-green/10 transition-colors"
          >
            View all results
          </Link>
        </div>
      ) : (
        <div className="p-4 text-center text-pc-muted text-sm">No products found.</div>
      )}
    </div>
  );
}

function getCategoryIcon(name = '', slug = '') {
  const lower = `${name} ${slug}`.toLowerCase();
  if (lower.includes('flower')) {
    return (
      <svg className="w-5 h-5 text-pc-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
      </svg>
    );
  }
  if (lower.includes('edible') || lower.includes('gummi')) {
    return (
      <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  if (lower.includes('vape') || lower.includes('cart')) {
    return (
      <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18m6-18v18M6 8h12M6 16h12" />
      </svg>
    );
  }
  if (lower.includes('pre-roll') || lower.includes('preroll') || lower.includes('roll')) {
    return (
      <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m-15 0 15 15" />
      </svg>
    );
  }
  if (lower.includes('wax') || lower.includes('concentrate') || lower.includes('extract') || lower.includes('dab')) {
    return (
      <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      </svg>
    );
  }
  if (lower.includes('accessor')) {
    return (
      <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-pc-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
    </svg>
  );
}

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const { data: session, status } = useSession();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountRef = useRef(null);
  
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(console.error);
  }, []);
  
  const searchContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchQuery('');
        setMobileSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-pc-black/80 backdrop-blur-xl border-b border-pc-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 relative">
          
          {/* Logo (hidden on mobile if search is open) */}
          <div className={`${mobileSearchOpen ? 'hidden sm:flex' : 'flex'} items-center`}>
            <Link href="/" className="flex items-center gap-2 group">
              <Image 
                src="/logo.png" 
                alt="Holybuds" 
                width={400}
                height={100}
                priority
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-pc-muted hover:text-white transition-colors">Home</Link>
            <Link href="/menu" className="text-sm font-medium text-pc-muted hover:text-white transition-colors">Menu</Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/menu?category=${cat.slug}`} className="text-sm font-medium text-pc-muted hover:text-white transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Right side icons & Desktop Search */}
          <div className="flex items-center gap-1 sm:gap-4 ml-auto" ref={searchContainerRef}>
            
            {/* Search */}
            {mobileSearchOpen ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery) window.location.href = `/menu?search=${encodeURIComponent(searchQuery)}`;
                }}
                className="flex relative items-center flex-1 mr-2 sm:mr-0 animate-fade-in"
              >
                <input 
                  type="text" 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..." 
                  className="bg-pc-smoke/50 text-white text-sm rounded-full pl-9 pr-8 py-2 w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-pc-green transition-all"
                />
                <svg className="w-4 h-4 text-pc-muted absolute left-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <button type="button" onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }} className="absolute right-3 text-pc-muted hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <SearchDropdown query={searchQuery} onSelect={() => { setSearchQuery(''); setMobileSearchOpen(false); }} />
              </form>
            ) : (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="p-2 text-pc-muted hover:text-white transition-colors"
                title="Search"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            )}

            {/* Account Link / Dropdown */}
            {status === 'authenticated' ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="p-2 text-pc-muted hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </button>
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-pc-dark border border-pc-border rounded-xl shadow-2xl py-2 z-50 animate-scale-in">
                    <Link href="/account?tab=orders" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card hover:text-pc-green transition-colors">Orders</Link>
                    <Link href="/account?tab=rewards" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card hover:text-pc-green transition-colors">Rewards & Referrals</Link>
                    <Link href="/account?tab=favorites" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card hover:text-pc-green transition-colors">Favorites</Link>
                    <Link href="/account?tab=profile" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card hover:text-pc-green transition-colors">Profile</Link>
                    <Link href="/account?tab=settings" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card hover:text-pc-green transition-colors">Settings</Link>
                    <div className="border-t border-pc-border my-1"></div>
                    <button 
                      onClick={() => { setAccountDropdownOpen(false); signOut({ callbackUrl: '/login' }); }} 
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-pc-card transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/account"
                className="p-2 text-pc-muted hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-pc-muted hover:text-white transition-colors"
              id="cart-button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-pc-green text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-pc-muted hover:text-white transition-colors"
              id="mobile-menu-toggle"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {mobileOpen && (
          <div className="md:hidden pb-6 pt-3 animate-fade-in border-t border-pc-border/40 mt-2 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
            {/* Quick Navigation Pills */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Link 
                href="/" 
                onClick={() => setMobileOpen(false)} 
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-pc-green/10 border border-pc-border/50 hover:border-pc-green/40 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Home
              </Link>
              <Link 
                href="/menu" 
                onClick={() => setMobileOpen(false)} 
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-pc-green/15 hover:bg-pc-green/25 border border-pc-green/40 text-sm font-semibold text-pc-green transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                All Menu
              </Link>
            </div>

            {/* Categories Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold tracking-wider uppercase text-pc-muted">
                  Categories
                </span>
                <span className="text-[11px] text-pc-green font-medium">
                  {categories.length} Total
                </span>
              </div>

              {/* 2-Column Responsive Category Grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map(cat => {
                  const isWholesale = cat.slug?.toLowerCase() === 'wholesale';
                  return (
                    <Link 
                      key={cat.id} 
                      href={`/menu?category=${cat.slug}`} 
                      onClick={() => setMobileOpen(false)} 
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                        isWholesale
                          ? 'col-span-2 sm:col-span-3 bg-gradient-to-r from-amber-500/10 via-pc-card to-amber-500/10 border-amber-500/30 hover:border-amber-400/60'
                          : 'bg-pc-dark/70 hover:bg-pc-card border-pc-border/60 hover:border-pc-green/50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-pc-smoke/60 border border-pc-border/40 shrink-0 flex items-center justify-center relative">
                        {cat.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          />
                        ) : (
                          getCategoryIcon(cat.name, cat.slug)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-pc-green transition-colors truncate">
                          {cat.name}
                        </div>
                        {isWholesale && (
                          <span className="text-[10px] text-amber-400 font-semibold tracking-wide">
                            Bulk Pricing
                          </span>
                        )}
                      </div>
                      <svg className="w-3.5 h-3.5 text-pc-muted/50 group-hover:text-pc-green group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
