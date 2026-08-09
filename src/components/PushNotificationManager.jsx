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
      <div className="text-xs text-pc-muted/50 p-2 border border-pc-border/30 rounded-lg">
        Push notifications are not supported in this browser (or you are not using https). 
        On iOS, you must add this page to your Home Screen.
      </div>
    );
  }

  return (
    <div className="p-3 bg-pc-dark/50 border border-pc-border rounded-lg text-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-bold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            Background Notifications
          </h4>
          <p className="text-xs text-pc-muted">Receive alerts for new orders when the app is closed.</p>
        </div>
        {subscription ? (
          <button onClick={unsubscribeFromPush} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors font-semibold">
            Disable
          </button>
        ) : (
          <button onClick={subscribeToPush} className="text-xs px-3 py-1.5 bg-pc-green/20 text-pc-green hover:bg-pc-green/30 rounded transition-colors font-semibold">
            Enable
          </button>
        )}
      </div>
      {message && <p className="text-xs text-pc-gold mt-2 animate-fade-in-up">{message}</p>}
    </div>
  );
}
