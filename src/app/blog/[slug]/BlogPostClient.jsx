'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function BlogPostClient({ post, related = [] }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${post.title} via @HolyBudsNY`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const shareViaSms = () => {
    if (typeof window !== 'undefined') {
      const text = encodeURIComponent(`Check out this guide from Holy Buds: ${post.title} - ${window.location.href}`);
      window.open(`sms:?&body=${text}`, '_blank');
    }
  };

  return (
    <article className="min-h-screen bg-black text-white pt-24 pb-24 selection:bg-pc-green selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-pc-green/10 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-pc-muted mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Journal</Link>
          <span>/</span>
          <span className="text-pc-green font-medium truncate max-w-[200px] sm:max-w-none">
            {post.category}
          </span>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pc-green text-black">
              {post.category}
            </span>
            <span className="text-xs text-pc-muted">
              {post.readTime || '5 min read'}
            </span>
            <span className="text-pc-muted">•</span>
            <span className="text-xs text-pc-muted">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-pc-muted leading-relaxed mb-6 font-normal">
            {post.excerpt}
          </p>

          {/* Author and Action Row */}
          <div className="flex items-center justify-between py-4 border-y border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pc-green/20 border border-pc-green/40 flex items-center justify-center text-pc-green font-bold text-xs uppercase">
                HB
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {post.author || 'Holy Buds Editorial'}
                </div>
                <div className="text-xs text-pc-muted">
                  Long Island Cannabis Specialists
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-pc-muted hover:text-white transition-all text-xs flex items-center gap-1.5"
                title="Copy Link"
              >
                <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.849a6 6 0 0 0-8.486 0L4.545 6.485a6 6 0 0 0 8.486 8.485l1.637-1.637m-2.122-2.122 1.637-1.637a6 6 0 0 1 8.486 8.485l-2.635 2.636a6 6 0 0 1-8.486 0" />
                </svg>
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={shareOnTwitter}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-pc-muted hover:text-white transition-all"
                title="Share on X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              <button
                onClick={shareViaSms}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-pc-muted hover:text-white transition-all sm:hidden"
                title="Share via SMS"
              >
                <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018Z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-12 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-pc-card aspect-video relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Markdown Content */}
        <div className="prose prose-invert max-w-none mb-16">
          <ReactMarkdown
            components={{
              h2: ({ ...props }) => (
                <h2
                  className="text-2xl sm:text-3xl font-black text-white mt-12 mb-5 border-l-4 border-pc-green pl-4 tracking-tight"
                  {...props}
                />
              ),
              h3: ({ ...props }) => (
                <h3
                  className="text-xl sm:text-2xl font-bold text-white mt-8 mb-4 tracking-tight"
                  {...props}
                />
              ),
              p: ({ ...props }) => (
                <p
                  className="text-pc-muted text-base sm:text-lg leading-relaxed mb-6 font-normal"
                  {...props}
                />
              ),
              ul: ({ ...props }) => (
                <ul
                  className="space-y-3 mb-6 list-disc list-inside text-pc-muted text-base leading-relaxed pl-2"
                  {...props}
                />
              ),
              ol: ({ ...props }) => (
                <ol
                  className="space-y-3 mb-6 list-decimal list-inside text-pc-muted text-base leading-relaxed pl-2"
                  {...props}
                />
              ),
              li: ({ ...props }) => (
                <li className="text-white/90" {...props} />
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  className="border-l-4 border-pc-green/70 bg-white/[0.03] p-5 rounded-r-2xl italic text-white my-8 text-base"
                  {...props}
                />
              ),
              a: ({ href, children, ...props }) => (
                <Link
                  href={href || '#'}
                  className="text-pc-green hover:underline font-semibold transition-colors"
                  {...props}
                >
                  {children}
                </Link>
              ),
              strong: ({ ...props }) => (
                <strong className="text-white font-bold" {...props} />
              )
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* In-Article Storefront Callout */}
        <div className="rounded-3xl border border-pc-green/40 bg-gradient-to-br from-pc-green/15 via-white/[0.02] to-pc-green/10 p-8 sm:p-10 mb-16 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pc-green text-black mb-3">
              Direct Long Island Delivery
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
              Ready to Experience Premium Holy Buds?
            </h3>
            <p className="text-xs sm:text-sm text-pc-muted leading-relaxed mb-6">
              Browse our live menu of top-tier flower, live resin cartridges, solventless hash rosin, and potent edibles. Same-day delivery across Long Island.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-pc-green hover:bg-[#1db326] text-black transition-all shadow-lg shadow-pc-green/20 hover:scale-105 active:scale-95"
            >
              Order Online Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <div className="pt-12 border-t border-white/10">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-6 uppercase">
              More From Our Journal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(relPost => (
                <Link
                  key={relPost.slug}
                  href={`/blog/${relPost.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-pc-green/50 transition-all p-4"
                >
                  <div className="h-32 rounded-xl overflow-hidden bg-pc-card mb-3 relative">
                    {relPost.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={relPost.coverImage}
                        alt={relPost.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-pc-muted">
                        Holy Buds
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-pc-green uppercase tracking-wide mb-1">
                    {relPost.category}
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-pc-green transition-colors line-clamp-2 leading-snug">
                    {relPost.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

