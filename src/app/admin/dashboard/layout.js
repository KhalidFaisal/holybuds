'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminGlobalSearch from '@/components/AdminGlobalSearch';

export default function AdminDashboardLayout({ children }) {
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      fetch('/api/admin/logout', { method: 'POST' }).finally(() => {
        router.push('/admin');
      });
      return;
    }
    setAuthed(true);
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pc-black">
        <div className="animate-pulse text-pc-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-pc-black">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-pc-dark border-b border-pc-border shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Holybuds" className="h-6 w-auto object-contain" />
          <span className="text-sm font-black tracking-tight text-gradient uppercase">Admin</span>
        </div>
        <div className="flex-1 mx-4">
          <AdminGlobalSearch />
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-pc-muted hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex-1' : 'hidden'} md:block z-40 shrink-0 md:h-full overflow-hidden`}>
        <AdminSidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      <main className={`${sidebarOpen ? 'hidden' : 'flex-1'} md:block overflow-y-auto`}>
        <div className="hidden md:flex p-4 border-b border-pc-border bg-pc-dark/50 items-center justify-center">
          <div className="w-full max-w-2xl">
            <AdminGlobalSearch />
          </div>
        </div>
        <div className="p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
