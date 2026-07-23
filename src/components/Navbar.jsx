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
                  <div className="absolute right-0 mt-2 w-48 bg-pc-dark border border-pc-border rounded-xl shadow-2xl py-2 z-50 animate-scale-in">
                    <Link href="/account?tab=profile" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card transition-colors">Profile</Link>
                    <Link href="/account?tab=orders" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card transition-colors">Orders</Link>
                    <Link href="/account?tab=favorites" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card transition-colors">Favorites</Link>
                    <Link href="/account?tab=rewards" onClick={() => setAccountDropdownOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-pc-card transition-colors">Rewards & Referrals</Link>
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
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-pc-muted hover:text-white transition-colors py-2">Home</Link>
              <Link href="/menu" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-pc-muted hover:text-white transition-colors py-2">Menu</Link>
              {categories.map(cat => (
                <Link key={cat.id} href={`/menu?category=${cat.slug}`} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-pc-muted hover:text-white transition-colors py-2">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
