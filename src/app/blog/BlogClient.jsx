'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  'All',
  'Cannabis 101',
  'Strain Guides',
  'Edibles & Dosing',
  'Delivery & Lifestyle',
  'Wellness'
];

export default function BlogClient({ initialData }) {
  const [posts] = useState(initialData?.posts || []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered posts based on active category and search
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory =
        selectedCategory === 'All' ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title?.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q) ||
        (post.tags && post.tags.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 selection:bg-pc-green selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-pc-green/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-pc-muted mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-pc-green font-medium">Journal & Guides</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pc-green/10 border border-pc-green/30 text-pc-green text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-pc-green" />
            Holy Buds Education
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
            The Budtender&apos;s Journal
          </h1>
          <p className="text-sm sm:text-base text-pc-muted leading-relaxed">
            Expert cannabis guides, strain genetics, dosing tips, and local Long Island dispensary culture straight from our team.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-pc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search guides, strains, terpenes, dosing..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-pc-muted/60 text-sm focus:outline-none focus:border-pc-green focus:ring-1 focus:ring-pc-green transition-all shadow-xl backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-pc-muted hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-pc-green text-black border-pc-green shadow-lg shadow-pc-green/20 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-pc-muted hover:text-white border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="py-20 text-center glass-card border border-white/10 rounded-3xl p-8 max-w-md mx-auto">
            <svg className="w-12 h-12 text-pc-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <h3 className="text-lg font-bold text-white mb-1">No Articles Found</h3>
            <p className="text-xs text-pc-muted mb-4">
              We could not find any articles matching &quot;{searchQuery}&quot;. Try adjusting your search term or category filter.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pc-green text-black hover:bg-[#1db326] transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Featured Hero Article Card */}
        {featuredPost && (
          <div className="mb-12">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group block relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-pc-green/50 transition-all duration-300 shadow-2xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
                {/* Image */}
                <div className="lg:col-span-7 h-64 sm:h-80 lg:h-96 relative overflow-hidden bg-pc-card">
                  {featuredPost.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-pc-card flex items-center justify-center text-pc-muted">
                      Holy Buds
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pc-green text-black">
                      Featured Guide
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                      {featuredPost.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-pc-muted mb-3">
                      <span>{featuredPost.readTime || '5 min read'}</span>
                      <span>•</span>
                      <span>
                        {new Date(featuredPost.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight group-hover:text-pc-green transition-colors leading-tight mb-3">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-pc-muted line-clamp-3 leading-relaxed mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs font-semibold text-white/80">
                      By {featuredPost.author || 'Holy Buds Team'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pc-green group-hover:translate-x-1 transition-transform">
                      Read Full Article
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Standard Articles Grid */}
        {standardPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
            {standardPosts.map(post => (
              <Link
                key={post.id || post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-pc-green/50 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div>
                  {/* Card Cover */}
                  <div className="h-48 relative overflow-hidden bg-pc-card">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-pc-card flex items-center justify-center text-pc-muted">
                        Holy Buds
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-[11px] text-pc-muted mb-2">
                      <span>{post.readTime || '5 min read'}</span>
                      <span>•</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-pc-green transition-colors leading-snug line-clamp-2 mb-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-pc-muted line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-pc-muted/70 text-[11px]">
                    By {post.author || 'Holy Buds'}
                  </span>
                  <span className="font-bold text-pc-green group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Read
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Local Long Island Delivery CTA Banner */}
        <div className="rounded-3xl border border-pc-green/30 bg-gradient-to-r from-pc-green/15 via-black to-pc-green/10 p-8 sm:p-12 relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xl">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pc-green text-black mb-3">
              Fast Delivery Across Long Island
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Craving Fresh Strains Delivered Today?
            </h3>
            <p className="text-xs sm:text-sm text-pc-muted mt-2 leading-relaxed">
              Discreet door-to-door cannabis delivery across Nassau & Suffolk counties. Open until midnight (12:00 AM) on Friday and Saturday nights.
            </p>
          </div>

          <Link
            href="/menu"
            className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider bg-pc-green hover:bg-[#1db326] text-black transition-all shadow-xl shadow-pc-green/20 shrink-0 self-center sm:self-auto hover:scale-105 active:scale-95"
          >
            Explore Live Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

