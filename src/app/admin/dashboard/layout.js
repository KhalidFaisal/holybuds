'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

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
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block z-40 shrink-0 h-full`}>
        <AdminSidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
