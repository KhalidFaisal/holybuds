'use client';

import { useState, useEffect } from 'react';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async function subscribeToPush() {
    if (!publicVapidKey) {
      setMessage('VAPID public key not configured.');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      setSubscription(sub);
      
      // Save subscription to the database
      const res = await fetch('/api/admin/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        setMessage('Successfully enabled background notifications!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save subscription.');
      }
    } catch (error) {
      console.error('Push subscription error:', error);
      if (error.name === 'NotAllowedError') {
        setMessage('Notification permission was denied. Please allow notifications in your browser/OS settings.');
      } else {
        setMessage('Failed to enable notifications.');
      }
    }
  }

  async function unsubscribeFromPush() {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        // Also remove from DB
        await fetch('/api/admin/notifications/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: subscription.endpoint }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setMessage('Notifications disabled.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Push unsubscription error:', error);
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-2 bg-pc-dark/50 border border-pc-border rounded-lg" title="Not supported in this browser. On iOS, add to Home Screen first.">
        <svg className="w-5 h-5 text-pc-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.163a1.996 1.996 0 01-.157-1.121" />
        </svg>
        <span className="text-[10px] text-pc-muted/50 leading-tight">Alerts Not<br/>Supported</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between gap-4 p-2 bg-pc-gold/10 border border-pc-gold/30 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-pc-gold/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-pc-gold uppercase tracking-wider leading-none mb-0.5">Push Alerts</span>
          <span className="text-[10px] text-pc-gold/70 leading-none">Background orders</span>
        </div>
      </div>
      {subscription ? (
        <button onClick={unsubscribeFromPush} className="text-[10px] px-3 py-1.5 bg-pc-dark/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-pc-muted border border-pc-border rounded transition-all font-bold tracking-wide">
          DISABLE
        </button>
      ) : (
        <button onClick={subscribeToPush} className="text-[10px] px-3 py-1.5 bg-pc-green hover:bg-pc-green/90 text-black rounded transition-all font-black tracking-wide shadow-[0_0_10px_rgba(34,197,94,0.3)]">
          ENABLE
        </button>
      )}
      {message && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-pc-dark border border-pc-border rounded text-[11px] text-pc-gold z-50 whitespace-nowrap shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}
