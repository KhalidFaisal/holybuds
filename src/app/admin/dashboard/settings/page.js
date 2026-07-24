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
  const [aiModel, setAiModel] = useState('agentrouter/gpt-5.5');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState('');

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [pointsPerDollar, setPointsPerDollar] = useState(1);
  const [signupBonus, setSignupBonus] = useState(50);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [messageLoyalty, setMessageLoyalty] = useState('');
  
  const [testingModel, setTestingModel] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const [aiStaffPicksEnabled, setAiStaffPicksEnabled] = useState(false);
  const [loadingAiPicks, setLoadingAiPicks] = useState(false);
  const [messageAiPicks, setMessageAiPicks] = useState('');
  const [generatingAiPicks, setGeneratingAiPicks] = useState(false);

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
          setAiModel(data.aiModel || 'openai/gpt-4o-mini');
          setOpenRouterApiKey(data.openRouterApiKey || '');
          setGroqApiKey(data.groqApiKey || '');
          
          if (data.loyaltyEnabled !== undefined) setLoyaltyEnabled(data.loyaltyEnabled);
          if (data.pointsPerDollar !== undefined) setPointsPerDollar(data.pointsPerDollar);
          if (data.signupBonus !== undefined) setSignupBonus(data.signupBonus);
          if (data.aiStaffPicksEnabled !== undefined) setAiStaffPicksEnabled(data.aiStaffPicksEnabled);
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
          openRouterApiKey: openRouterApiKey === '••••••••••••••••' ? undefined : openRouterApiKey,
          groqApiKey: groqApiKey === '••••••••••••••••' ? undefined : groqApiKey
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
        body: JSON.stringify({ 
          model: aiModel,
          openRouterApiKey: openRouterApiKey === '••••••••••••••••' ? undefined : openRouterApiKey,
          groqApiKey: groqApiKey === '••••••••••••••••' ? undefined : groqApiKey
        })
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

  const handleLoyaltySubmit = async (e) => {
    e.preventDefault();
    setLoadingLoyalty(true);
    setMessageLoyalty('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          loyaltyEnabled, 
          pointsPerDollar,
          signupBonus
        }),
      });

      if (res.ok) {
        setMessageLoyalty('Loyalty settings updated successfully.');
      } else {
        const data = await res.json();
        setMessageLoyalty(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageLoyalty('An error occurred.');
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const handleAiPicksSubmit = async (e) => {
    e.preventDefault();
    setLoadingAiPicks(true);
    setMessageAiPicks('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ aiStaffPicksEnabled }),
      });

      if (res.ok) {
        setMessageAiPicks('AI Staff Picks settings updated successfully.');
      } else {
        const data = await res.json();
        setMessageAiPicks(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageAiPicks('An error occurred.');
    } finally {
      setLoadingAiPicks(false);
    }
  };

  const handleGenerateAiPicks = async () => {
    setGeneratingAiPicks(true);
    setMessageAiPicks('');
    try {
      const res = await fetch('/api/admin/ai-staff-picks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        setMessageAiPicks('Successfully generated 10 new Staff Picks!');
      } else {
        const data = await res.json();
        setMessageAiPicks(data.error || 'Failed to generate picks.');
      }
    } catch (err) {
      setMessageAiPicks('An error occurred while generating picks.');
    } finally {
      setGeneratingAiPicks(false);
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

      {/* Loyalty & Rewards Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          Loyalty & Rewards
        </h2>
        <p className="text-pc-muted mb-6 text-sm">
          Configure the points system and sign-up bonuses. Turn it off if you do not wish to offer rewards.
        </p>

        <form onSubmit={handleLoyaltySubmit} className="space-y-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-6 bg-pc-black border border-pc-border p-4 rounded-xl">
            <span className="text-white font-medium">Enable Loyalty Program</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={loyaltyEnabled}
                onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pc-green"></div>
            </label>
          </div>

          {loyaltyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">Points Earned Per $1 Spent</label>
                <input
                  type="number"
                  min="0"
                  value={pointsPerDollar}
                  onChange={(e) => setPointsPerDollar(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pc-muted mb-1">New Customer Sign-Up Bonus (Points)</label>
                <input
                  type="number"
                  min="0"
                  value={signupBonus}
                  onChange={(e) => setSignupBonus(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                  required
                />
              </div>
            </div>
          )}

          {messageLoyalty && (
            <div className={`p-3 rounded-lg text-sm mt-4 ${messageLoyalty.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageLoyalty}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingLoyalty}
              className="btn-primary w-full py-3"
            >
              {loadingLoyalty ? 'Saving...' : 'Update Loyalty Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Staff Picks Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-purple-400"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.86-12A2 2 0 0 1 15 2a22 22 0 0 1 12 3.86c0 1.22-.78 2.36-1.93 2.53A22 22 0 0 1 15 12z"/><path d="M16 11c1.5 0 3-.5 3-3s-1.5-3-3-3-3 1.5-3 3 1.5 3 3 3z"/></svg>
          AI Auto-Select Staff Picks
        </h2>
        <p className="text-pc-muted mb-6 text-sm">
          Let AI automatically pick 10 exciting, diverse products to feature as &quot;Staff Picks&quot; on your homepage. 
          When enabled, the picks will automatically update once a week.
        </p>

        <form onSubmit={handleAiPicksSubmit} className="space-y-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-6 bg-pc-black border border-pc-border p-4 rounded-xl">
            <span className="text-white font-medium">Enable AI Auto-Select</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={aiStaffPicksEnabled}
                onChange={(e) => setAiStaffPicksEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pc-green"></div>
            </label>
          </div>

          <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loadingAiPicks}
              className="btn-primary flex-1 py-3"
            >
              {loadingAiPicks ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              type="button"
              onClick={handleGenerateAiPicks}
              disabled={generatingAiPicks}
              className="btn-secondary flex-1 py-3"
            >
              {generatingAiPicks ? 'Generating...' : 'Generate Picks Now'}
            </button>
          </div>

          {messageAiPicks && (
            <div className={`p-3 rounded-lg text-sm mt-4 ${messageAiPicks.includes('uccess') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageAiPicks}
            </div>
          )}
        </form>
      </div>

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
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          AI Budtender Settings
        </h2>
        <p className="text-pc-muted mb-6 text-sm">
          Customize the instructions given to the AI Chatbot on your storefront. Train it to use specific slang, recommend certain products, or adopt a unique persona.
        </p>

        <form onSubmit={handlePromptSubmit} className="space-y-4">
          {/* OpenRouter API Key */}
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">OpenRouter API Key</label>
            <p className="text-xs text-pc-muted mb-2">Leave blank to use the server&apos;s default environment key. Add your own key to bypass free limits or use paid models.</p>
            {openRouterApiKey === '••••••••••••••••' ? (
              <div className="flex items-center gap-4 bg-pc-black border border-pc-border rounded-xl px-4 py-2 mb-4">
                <span className="text-pc-green font-bold flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                  Configured
                </span>
                <span className="text-pc-muted flex-1 text-right tracking-widest">{openRouterApiKey}</span>
                <button
                  type="button"
                  onClick={() => setOpenRouterApiKey('')}
                  className="text-xs font-bold text-pc-muted hover:text-white px-3 py-1 bg-pc-dark rounded-lg transition-colors border border-pc-border hover:border-pc-muted"
                >
                  Edit
                </button>
              </div>
            ) : (
              <input
                type="password"
                value={openRouterApiKey}
                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green mb-4"
              />
            )}
          </div>

          {/* Groq API Key */}
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Groq API Key</label>
            <p className="text-xs text-pc-muted mb-2">Leave blank to use the server&apos;s default environment key. Add your own key to bypass free limits or use paid models.</p>
            {groqApiKey === '••••••••••••••••' ? (
              <div className="flex items-center gap-4 bg-pc-black border border-pc-border rounded-xl px-4 py-2 mb-4">
                <span className="text-pc-green font-bold flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                  Configured
                </span>
                <span className="text-pc-muted flex-1 text-right tracking-widest">{groqApiKey}</span>
                <button
                  type="button"
                  onClick={() => setGroqApiKey('')}
                  className="text-xs font-bold text-pc-muted hover:text-white px-3 py-1 bg-pc-dark rounded-lg transition-colors border border-pc-border hover:border-pc-muted"
                >
                  Edit
                </button>
              </div>
            ) : (
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green mb-4"
              />
            )}
          </div>



          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Primary AI Model</label>
            <div className="flex gap-2">
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="flex-1 bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green appearance-none"
              >
                <option value="openrouter/free">OpenRouter Free (Default)</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="openai/gpt-5-mini">GPT-5 Mini</option>

                <option value="groq-llama-3.1-8b-instant">Groq LLaMA 3.1 8B (Free)</option>
                <option value="groq-llama-3.3-70b-versatile">Groq LLaMA 3.3 70B (Free)</option>
                <option value="groq-mixtral-8x7b-32768">Groq Mixtral 8x7B (Free)</option>
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
