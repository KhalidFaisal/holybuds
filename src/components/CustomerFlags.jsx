'use client';

import { useState, useEffect } from 'react';

export default function CustomerFlags({ phone }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) {
      setLoading(false);
      return;
    }

    const fetchFlags = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}/flags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFlags(data.flags || []);
        }
      } catch (e) {
        console.error('Error fetching flags:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [phone]);

  if (loading) {
    return <div className="animate-pulse w-24 h-4 bg-pc-smoke rounded mt-2"></div>;
  }

  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {flags.map((flag, idx) => {
        let badgeClass = 'bg-pc-card text-pc-muted border border-pc-border';
        
        if (flag.includes('VIP')) badgeClass = 'bg-pc-gold/20 text-pc-gold border border-pc-gold/30';
        else if (flag.includes('Frequent Cancels')) badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
        else if (flag.includes('Orders Weekly')) badgeClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        else if (flag.includes('Lifetime Spend')) badgeClass = 'bg-pc-green/20 text-pc-green border border-pc-green/30';

        return (
          <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${badgeClass}`}>
            {flag}
          </span>
        );
      })}
    </div>
  );
}
