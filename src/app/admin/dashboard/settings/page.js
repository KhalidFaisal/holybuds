'use client';

import { useState, useEffect, useMemo } from 'react';

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirm, setAdminConfirm] = useState('');

  const [currentPassword, setCurrentPassword] = useState('Holymoly');
  
  const [loadingSite, setLoadingSite] = useState(false);
  const [messageSite, setMessageSite] = useState('');

  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [messageAdmin, setMessageAdmin] = useState('');

  const [timezone, setTimezone] = useState('');
  const [currentTimezone, setCurrentTimezone] = useState('UTC');
  const [loadingTimezone, setLoadingTimezone] = useState(false);
  const [messageTimezone, setMessageTimezone] = useState('');

  const [chatbotPrompt, setChatbotPrompt] = useState('');
  const [aiModel, setAiModel] = useState('openrouter/free');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState('');
  
  const [testingModel, setTestingModel] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const timezones = useMemo(() => {
    if (typeof Intl === 'undefined' || !Intl.supportedValuesOf) return [];
    const tzs = Intl.supportedValuesOf('timeZone');
    const date = new Date();
    
    return tzs.map(tz => {
      let offsetStr = '';
      let offsetValue = 0;
      try {
        const format = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
        const parts = format.formatToParts(date);
        const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
        offsetStr = offsetPart.replace('GMT', 'UTC');
        
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        offsetValue = tzDate.getTime() - utcDate.getTime();
      } catch(e) {}
      
      return { 
        name: tz, 
        label: `${offsetStr ? `(${offsetStr}) ` : ''}${tz.replace(/_/g, ' ')}`, 
        offsetValue 
      };
    }).sort((a, b) => a.offsetValue - b.offsetValue);
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sitePassword) setCurrentPassword(data.sitePassword);
          if (data.timezone) {
            setCurrentTimezone(data.timezone);
            setTimezone(data.timezone);
          }
          if (data.chatbotPrompt) {
            setChatbotPrompt(data.chatbotPrompt);
          }
          if (data.aiModel) {
            setAiModel(data.aiModel);
          }
          if (data.openRouterApiKey !== undefined) {
            setOpenRouterApiKey(data.openRouterApiKey);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchSettings();
  }, []);

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch (e) {
      console.error('Could not detect timezone', e);
    }
  };

  const handleTimezoneSubmit = async (e) => {
    e.preventDefault();
    setLoadingTimezone(true);
    setMessageTimezone('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ timezone }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessageTimezone('Timezone updated successfully.');
        setCurrentTimezone(data.timezone || timezone);
      } else {
        const data = await res.json();
        setMessageTimezone(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageTimezone('An error occurred.');
    } finally {
      setLoadingTimezone(false);
    }
  };

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    setLoadingPrompt(true);
    setMessagePrompt('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          chatbotPrompt, 
          aiModel,
          openRouterApiKey: openRouterApiKey === '••••••••••••••••' ? undefined : openRouterApiKey 
        }),
      });

      if (res.ok) {
        setMessagePrompt('AI Budtender prompt updated successfully.');
      } else {
        const data = await res.json();
        setMessagePrompt(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessagePrompt('An error occurred.');
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleTestModel = async () => {
    setTestingModel(true);
    setTestMessage('');
    try {
      const res = await fetch('/api/admin/settings/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ model: aiModel })
      });
      if (res.ok) {
        const data = await res.json();
        setTestMessage(`Success! Response: "${data.reply}"`);
      } else {
        const data = await res.json();
        setTestMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setTestMessage('Failed to connect to test endpoint.');
    } finally {
      setTestingModel(false);
    }
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessageSite('Passwords do not match.');
      return;
    }

    setLoadingSite(true);
    setMessageSite('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ sitePassword: password }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessageSite('Site password updated successfully.');
        setCurrentPassword(data.sitePassword);
        setPassword('');
        setConfirm('');
      } else {
        const data = await res.json();
        setMessageSite(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageSite('An error occurred.');
    } finally {
      setLoadingSite(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (adminPassword !== adminConfirm) {
      setMessageAdmin('Passwords do not match.');
      return;
    }

    setLoadingAdmin(true);
    setMessageAdmin('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ adminPassword: adminPassword }),
      });

      if (res.ok) {
        setMessageAdmin('Admin password updated successfully.');
        setAdminPassword('');
        setAdminConfirm('');
      } else {
        const data = await res.json();
        setMessageAdmin(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageAdmin('An error occurred.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-pc-muted">Manage global site settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Site Access Password</h2>
        <p className="text-pc-muted mb-6 text-sm">
          Change the password required for users to enter the site. The current password is <span className="text-pc-green font-bold font-mono px-1">{currentPassword}</span>.
        </p>

        <form onSubmit={handleSiteSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>

          {messageSite && (
            <div className={`p-3 rounded-lg text-sm ${messageSite.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageSite}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingSite}
            className="btn-primary w-full py-3"
          >
            {loadingSite ? 'Saving...' : 'Update Site Password'}
          </button>
        </form>
      </div>

      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Admin Dashboard Password</h2>
        <p className="text-pc-muted mb-6 text-sm">
          Change the password you use to log into this admin dashboard.
        </p>

        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">New Admin Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Confirm Admin Password</label>
            <input
              type="password"
              value={adminConfirm}
              onChange={(e) => setAdminConfirm(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>

          {messageAdmin && (
            <div className={`p-3 rounded-lg text-sm ${messageAdmin.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageAdmin}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingAdmin}
            className="btn-secondary w-full py-3"
          >
            {loadingAdmin ? 'Saving...' : 'Update Admin Password'}
          </button>
        </form>
      </div>

      {/* Timezone Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-4">Timezone</h2>
        <p className="text-pc-muted mb-6 text-sm">
          Set the global timezone for your store. This affects how dates and times are displayed.
          The current timezone is <span className="text-pc-green font-bold font-mono px-1">{currentTimezone}</span>.
        </p>

        <form onSubmit={handleTimezoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Store Timezone (IANA Format)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex-1 bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green appearance-none"
                required
              >
                <option value="" disabled>Select a timezone...</option>
                {timezones.map(tz => (
                  <option key={tz.name} value={tz.name}>{tz.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAutoDetectTimezone}
                className="px-4 py-2 bg-pc-green/10 text-pc-green hover:bg-pc-green hover:text-black rounded-xl text-sm font-bold transition-all whitespace-nowrap"
              >
                Auto-Detect
              </button>
            </div>
          </div>

          {messageTimezone && (
            <div className={`p-3 rounded-lg text-sm ${messageTimezone.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageTimezone}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingTimezone}
            className="btn-primary w-full py-3"
          >
            {loadingTimezone ? 'Saving...' : 'Update Timezone'}
          </button>
        </form>
      </div>

      {/* AI Settings Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-4">✨ AI Budtender Settings</h2>
        <p className="text-pc-muted mb-6 text-sm">
          Customize the instructions given to the AI Chatbot on your storefront. Train it to use specific slang, recommend certain products, or adopt a unique persona.
        </p>

        <form onSubmit={handlePromptSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Custom OpenRouter API Key</label>
            <p className="text-xs text-pc-muted mb-2">Leave blank to use the server's default environment key. Add your own key to bypass free limits or use paid models.</p>
            <input
              type="password"
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green mb-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">AI Model (OpenRouter)</label>
            <div className="flex gap-2">
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="flex-1 bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green appearance-none"
              >
                <option value="openrouter/free">OpenRouter Free (Default)</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="openai/gpt-5-mini">GPT-5 Mini</option>
              </select>
              <button
                type="button"
                onClick={handleTestModel}
                disabled={testingModel}
                className="px-4 py-2 bg-pc-green/10 text-pc-green hover:bg-pc-green hover:text-black rounded-xl text-sm font-bold transition-all whitespace-nowrap disabled:opacity-50"
              >
                {testingModel ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            {testMessage && (
              <div className={`mt-2 p-2 rounded text-xs ${testMessage.startsWith('Success') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                {testMessage}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">System Prompt</label>
            <textarea
              value={chatbotPrompt}
              onChange={(e) => setChatbotPrompt(e.target.value)}
              rows={6}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
            />
          </div>

          {messagePrompt && (
            <div className={`p-3 rounded-lg text-sm ${messagePrompt.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messagePrompt}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingPrompt}
            className="btn-primary w-full py-3"
          >
            {loadingPrompt ? 'Saving...' : 'Update AI Settings'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
