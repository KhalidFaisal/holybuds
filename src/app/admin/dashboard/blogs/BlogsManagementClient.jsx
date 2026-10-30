'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogsManagementClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Custom generation inputs
  const [customTopic, setCustomTopic] = useState('');
  const [customCategory, setCustomCategory] = useState('Cannabis 101');

  // Neodymium API Key settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  // Fetch blogs on manual refresh
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog?includeUnpublished=true&limit=100');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function initializeDashboard() {
      try {
        const res = await fetch('/api/blog?includeUnpublished=true&limit=100');
        const data = await res.json();
        if (active && data.posts) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        if (active) setLoading(false);
      }

      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok && active) {
          const data = await res.json();
          if (data.neodymiumApiKey && data.neodymiumApiKey !== '') {
            setIsKeyConfigured(true);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }

    initializeDashboard();
    return () => {
      active = false;
    };
  }, []);

  // Save Neodymium API Key
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setSavingKey(true);
    setKeyMsg('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          neodymiumApiKey: apiKeyInput.trim()
        })
      });

      if (res.ok) {
        setIsKeyConfigured(true);
        setApiKeyInput('');
        setKeyMsg('Neodymium API Key saved successfully');
        setTimeout(() => setKeyMsg(''), 4000);
      } else {
        const d = await res.json();
        setKeyMsg(d.error || 'Failed to save API key');
      }
    } catch (err) {
      setKeyMsg('Network error saving API key');
    } finally {
      setSavingKey(false);
    }
  };

  // Generate article (1-click or custom)
  const handleGenerate = async (topic = '', category = '') => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    setGenerationStep('Connecting to Neodymium AI Proxy...');

    try {
      const token = localStorage.getItem('admin_token');
      setGenerationStep('Generating in-depth cannabis educational content...');

      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          category: category || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGenerationStep('Finalizing and publishing article...');
      setSuccessMsg(`Published: "${data.post?.title || 'New Blog Post'}"`);
      if (topic) setCustomTopic('');
      await fetchBlogs();
    } catch (err) {
      setError(err.message || 'An error occurred during blog generation.');
    } finally {
      setGenerating(false);
      setGenerationStep('');
    }
  };

  // Toggle publish
  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/blog', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id,
          published: !currentStatus
        })
      });

      if (res.ok) {
        setPosts(prev =>
          prev.map(p => (p.id === id ? { ...p, published: !currentStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  // Delete post
  const handleDeletePost = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/blog?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-pc-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Blog & AI Content Publisher
          </h1>
          <p className="text-sm text-pc-muted mt-1">
            Automated cannabis educational articles, strain breakdowns, and Long Island delivery guides.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-pc-border transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View Public Blog (/blog)
          </Link>
          <button
            onClick={fetchBlogs}
            disabled={loading}
            className="p-2 rounded-xl bg-pc-card hover:bg-pc-border/60 text-pc-muted hover:text-white border border-pc-border transition-all"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <div className="font-bold">Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-pc-green/10 border border-pc-green/30 text-pc-green text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <div className="font-bold">Success</div>
            <div>{successMsg}</div>
          </div>
        </div>
      )}

      {/* Grid: AI Generator + API Key Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1 & 2: AI Publisher (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 border border-pc-border rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pc-green animate-pulse" />
                AI Auto-Generator (Neodymium)
              </h2>
              <p className="text-xs text-pc-muted mt-0.5">
                Automatically writes 800+ word SEO articles with markdown headings, FAQs, and product links.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-pc-green/10 border border-pc-green/30 text-pc-green">
              Model: auto
            </span>
          </div>

          {/* 1-Click Fast Button */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Instant 1-Click Publishing</div>
              <div className="text-xs text-pc-muted">
                Picks the next trending cannabis topic and publishes immediately.
              </div>
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-pc-green hover:bg-[#1db326] text-black transition-all shadow-lg shadow-pc-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  <span>Generate Next Article</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Prompt Form */}
          <div className="space-y-3 pt-2 border-t border-pc-border/40">
            <div className="text-xs font-bold uppercase tracking-wider text-pc-muted">
              Or Specify Custom Topic
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="e.g. Best weed strains for outdoor concerts..."
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                disabled={generating}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-pc-dark border border-pc-border text-white text-sm placeholder-pc-muted/60 focus:outline-none focus:border-pc-green transition-all"
              />
              <select
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                disabled={generating}
                className="px-3.5 py-2.5 rounded-xl bg-pc-dark border border-pc-border text-white text-sm focus:outline-none focus:border-pc-green transition-all"
              >
                <option value="Cannabis 101">Cannabis 101</option>
                <option value="Strain Guides">Strain Guides</option>
                <option value="Edibles & Dosing">Edibles & Dosing</option>
                <option value="Delivery & Lifestyle">Delivery & Lifestyle</option>
                <option value="Wellness">Wellness</option>
              </select>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleGenerate(customTopic, customCategory)}
                disabled={generating || !customTopic.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-pc-border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Custom Article
              </button>
            </div>
          </div>

          {/* Live Progress State */}
          {generating && (
            <div className="mt-4 p-3.5 rounded-xl bg-pc-green/10 border border-pc-green/30 text-xs text-pc-green flex items-center gap-3 animate-pulse">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{generationStep || 'Working with Neodymium AI...'}</span>
            </div>
          )}
        </div>

        {/* Card 3: Neodymium API Configuration */}
        <div className="glass-card p-6 border border-pc-border rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Neodymium API</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                  isKeyConfigured
                    ? 'bg-pc-green/20 text-pc-green border border-pc-green/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {isKeyConfigured ? 'Connected' : 'Missing Key'}
              </span>
            </div>
            <p className="text-xs text-pc-muted mb-4">
              Connect your unified API key (<code className="text-pc-green">freellmapi-25...</code>) to authenticate requests to the Neodymium proxy.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                placeholder={isKeyConfigured ? '••••••••••••••••••••••••' : 'Enter freellmapi-... key'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-pc-dark border border-pc-border text-white text-xs placeholder-pc-muted/50 focus:outline-none focus:border-pc-green transition-all"
              />
              <button
                type="submit"
                disabled={savingKey || !apiKeyInput.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-pc-border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingKey ? 'Saving...' : 'Update API Key'}
              </button>
            </form>

            {keyMsg && (
              <p className="text-[11px] text-pc-green mt-2 text-center font-medium">
                {keyMsg}
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-pc-border/40 text-[11px] text-pc-muted space-y-1">
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="text-white font-mono text-[10px]">neodymium.app/v1</span>
            </div>
            <div className="flex justify-between">
              <span>Model Routing:</span>
              <span className="text-pc-green font-mono text-[10px]">auto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Table Section */}
      <div className="glass-card border border-pc-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-pc-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">All Published Articles</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-pc-border text-pc-muted">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-pc-muted text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin text-pc-green" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading articles...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-pc-muted text-sm space-y-2">
            <div>No articles found yet.</div>
            <p className="text-xs text-pc-muted/70">
              Click &quot;Generate Next Article&quot; above to publish your first automated blog post.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-pc-muted">
              <thead className="bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-pc-muted/70 border-b border-pc-border/50">
                <tr>
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Read Time</th>
                  <th className="py-3.5 px-4 text-center">Views</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pc-border/40">
                {posts.map(post => (
                  <tr key={post.id || post.slug} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-pc-card border border-pc-border/60 overflow-hidden shrink-0">
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-pc-muted">
                              No Img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-md">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="font-bold text-white hover:text-pc-green transition-colors truncate block text-sm"
                          >
                            {post.title}
                          </Link>
                          <div className="text-xs text-pc-muted/60 truncate mt-0.5">
                            /blog/{post.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-pc-border/60 text-white">
                        {post.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {post.readTime || '5 min read'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-white">
                      {post.views || 0}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(post.id, post.published)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all ${
                          post.published
                            ? 'bg-pc-green/15 text-pc-green border border-pc-green/30 hover:bg-pc-green/25'
                            : 'bg-white/5 text-pc-muted border border-pc-border hover:bg-white/10'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-pc-muted hover:text-white transition-all"
                          title="View on site"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </Link>
                        {post.id && !post.id.startsWith('seed-') && (
                          <button
                            onClick={() => handleDeletePost(post.id, post.title)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-pc-muted hover:text-red-400 transition-all"
                            title="Delete article"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
