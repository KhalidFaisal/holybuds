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

  const [groqEnabled, setGroqEnabled] = useState(true);
  const [openRouterEnabled, setOpenRouterEnabled] = useState(true);
  const [enabledGroqModels, setEnabledGroqModels] = useState([
    'groq/compound',
    'openai/gpt-oss-120b',
    'groq/compound-mini',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b'
  ]);

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [pointsPerDollar, setPointsPerDollar] = useState(1);
  const [signupBonus, setSignupBonus] = useState(50);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [messageLoyalty, setMessageLoyalty] = useState('');
  
  const [testingModel, setTestingModel] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [groqTestResults, setGroqTestResults] = useState([]);

  const [aiStaffPicksEnabled, setAiStaffPicksEnabled] = useState(false);
  const [loadingAiPicks, setLoadingAiPicks] = useState(false);
  const [messageAiPicks, setMessageAiPicks] = useState('');
  const [generatingAiPicks, setGeneratingAiPicks] = useState(false);

  const [driverReferralReward, setDriverReferralReward] = useState(10);
  const [customerReferralDiscount, setCustomerReferralDiscount] = useState(5);
  const [driverBonusThreshold, setDriverBonusThreshold] = useState(10);
  const [driverBonusAmount, setDriverBonusAmount] = useState(100);
  const [loadingDriverPromo, setLoadingDriverPromo] = useState(false);
  const [messageDriverPromo, setMessageDriverPromo] = useState('');

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
          if (data.groqEnabled !== undefined) setGroqEnabled(data.groqEnabled);
          if (data.openRouterEnabled !== undefined) setOpenRouterEnabled(data.openRouterEnabled);
          if (data.enabledGroqModels) {
            try {
              setEnabledGroqModels(JSON.parse(data.enabledGroqModels));
            } catch (e) {}
          }
          
          if (data.loyaltyEnabled !== undefined) setLoyaltyEnabled(data.loyaltyEnabled);
          if (data.pointsPerDollar !== undefined) setPointsPerDollar(data.pointsPerDollar);
          if (data.signupBonus !== undefined) setSignupBonus(data.signupBonus);
          if (data.aiStaffPicksEnabled !== undefined) setAiStaffPicksEnabled(data.aiStaffPicksEnabled);
          if (data.driverReferralReward !== undefined) setDriverReferralReward(data.driverReferralReward);
          if (data.customerReferralDiscount !== undefined) setCustomerReferralDiscount(data.customerReferralDiscount);
          if (data.driverBonusThreshold !== undefined) setDriverBonusThreshold(data.driverBonusThreshold);
          if (data.driverBonusAmount !== undefined) setDriverBonusAmount(data.driverBonusAmount);
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
          groqApiKey: groqApiKey === '••••••••••••••••' ? undefined : groqApiKey,
          groqEnabled,
          openRouterEnabled,
          enabledGroqModels: JSON.stringify(enabledGroqModels)
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

  const handleTestOpenRouter = async () => {
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
          model: 'openrouter/free',
          openRouterApiKey: openRouterApiKey === '••••••••••••••••' ? undefined : openRouterApiKey
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

  const handleTestGroq = async () => {
    setTestingModel(true);
    setGroqTestResults([]);
    const modelsToTest = enabledGroqModels;
    
    let results = [];
    
    for (const m of modelsToTest) {
      setGroqTestResults([...results, { model: m, status: 'testing' }]);
      try {
        const res = await fetch('/api/admin/settings/test-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify({ 
            model: m,
            groqApiKey: groqApiKey === '••••••••••••••••' ? undefined : groqApiKey
          })
        });
        if (res.ok) {
          results.push({ model: m, status: 'success' });
        } else {
          results.push({ model: m, status: 'error' });
        }
      } catch (err) {
        results.push({ model: m, status: 'error' });
      }
      setGroqTestResults([...results]);
    }
    
    setTestingModel(false);
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

  const handleDriverPromoSubmit = async (e) => {
    e.preventDefault();
    setLoadingDriverPromo(true);
    setMessageDriverPromo('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          driverReferralReward: parseFloat(driverReferralReward),
          customerReferralDiscount: parseFloat(customerReferralDiscount),
          driverBonusThreshold: parseInt(driverBonusThreshold),
          driverBonusAmount: parseFloat(driverBonusAmount)
        }),
      });

      if (res.ok) {
        setMessageDriverPromo('Driver Referral Promos updated successfully.');
      } else {
        const data = await res.json();
        setMessageDriverPromo(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageDriverPromo('An error occurred.');
    } finally {
      setLoadingDriverPromo(false);
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
        <p className="text-pc-muted mb-6 text-sm min-h-[4rem]">
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
              <div className="flex flex-col justify-end h-full">
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
              
              <div className="flex flex-col justify-end h-full">
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

      {/* Driver Referral Promo Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Driver Referral Promos
        </h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[4rem]">
          Configure the payouts for drivers who refer new customers, and the discount those customers receive.
        </p>

        <form onSubmit={handleDriverPromoSubmit} className="space-y-4 flex flex-col flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col justify-end h-full">
              <label className="block text-sm font-medium text-pc-muted mb-1">Driver Reward ($ per referral)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={driverReferralReward}
                onChange={(e) => setDriverReferralReward(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                required
              />
            </div>
            
            <div className="flex flex-col justify-end h-full">
              <label className="block text-sm font-medium text-pc-muted mb-1">Customer Discount ($ off first order)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customerReferralDiscount}
                onChange={(e) => setCustomerReferralDiscount(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                required
              />
            </div>
            
            <div className="flex flex-col justify-end h-full">
              <label className="block text-sm font-medium text-pc-muted mb-1">Bonus Threshold (e.g., 10 referrals)</label>
              <input
                type="number"
                min="1"
                value={driverBonusThreshold}
                onChange={(e) => setDriverBonusThreshold(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                required
              />
            </div>
            
            <div className="flex flex-col justify-end h-full">
              <label className="block text-sm font-medium text-pc-muted mb-1">Bonus Amount ($ payout)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={driverBonusAmount}
                onChange={(e) => setDriverBonusAmount(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
                required
              />
            </div>
          </div>

          {messageDriverPromo && (
            <div className={`p-3 rounded-lg text-sm mt-4 ${messageDriverPromo.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageDriverPromo}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingDriverPromo}
              className="btn-primary w-full py-3"
            >
              {loadingDriverPromo ? 'Saving...' : 'Update Promos'}
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
        <p className="text-pc-muted mb-6 text-sm min-h-[4rem]">
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

        <div className="space-y-6">
          <div className="bg-pc-black border border-pc-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">OpenRouter Configuration</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={openRouterEnabled} onChange={(e) => setOpenRouterEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pc-green"></div>
              </label>
            </div>
            
            <div className={`transition-opacity ${openRouterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-pc-muted mb-1">OpenRouter API Key</label>
                <p className="text-xs text-pc-muted mb-2">Leave blank to use the server&apos;s default environment key.</p>
                {openRouterApiKey === '••••••••••••••••' ? (
                  <div className="flex items-center gap-4 bg-pc-dark border border-pc-border rounded-xl px-4 py-2 mb-4">
                    <span className="text-pc-green font-bold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                      Configured
                    </span>
                    <span className="text-pc-muted flex-1 text-right tracking-widest">{openRouterApiKey}</span>
                    <button type="button" onClick={() => setOpenRouterApiKey('')} className="text-xs font-bold text-pc-muted hover:text-white px-3 py-1 bg-pc-black rounded-lg transition-colors border border-pc-border hover:border-pc-muted">Edit</button>
                  </div>
                ) : (
                  <input type="password" value={openRouterApiKey} onChange={(e) => setOpenRouterApiKey(e.target.value)} placeholder="sk-or-v1-..." className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green mb-4" />
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleTestOpenRouter} disabled={testingModel} className="flex-1 px-4 py-2 bg-pc-dark border border-pc-border text-white hover:border-pc-green rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                  {testingModel ? 'Testing...' : 'Test OpenRouter'}
                </button>
                <button type="button" onClick={handlePromptSubmit} disabled={loadingPrompt} className="flex-1 px-4 py-2 bg-pc-green/10 text-pc-green hover:bg-pc-green hover:text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                  Save Settings
                </button>
              </div>
              {testMessage && <div className={`mt-4 p-3 rounded-lg text-xs ${testMessage.startsWith('Success') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{testMessage}</div>}
            </div>
          </div>

          <div className="bg-pc-black border border-pc-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Groq Configuration</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={groqEnabled} onChange={(e) => setGroqEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pc-green"></div>
              </label>
            </div>
            
            <div className={`transition-opacity ${groqEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-pc-muted mb-1">Groq API Key</label>
                <p className="text-xs text-pc-muted mb-2">Leave blank to use the server&apos;s default environment key.</p>
                {groqApiKey === '••••••••••••••••' ? (
                  <div className="flex items-center gap-4 bg-pc-dark border border-pc-border rounded-xl px-4 py-2 mb-4">
                    <span className="text-pc-green font-bold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                      Configured
                    </span>
                    <span className="text-pc-muted flex-1 text-right tracking-widest">{groqApiKey}</span>
                    <button type="button" onClick={() => setGroqApiKey('')} className="text-xs font-bold text-pc-muted hover:text-white px-3 py-1 bg-pc-black rounded-lg transition-colors border border-pc-border hover:border-pc-muted">Edit</button>
                  </div>
                ) : (
                  <input type="password" value={groqApiKey} onChange={(e) => setGroqApiKey(e.target.value)} placeholder="gsk_..." className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green mb-4" />
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-pc-muted mb-2">Enabled Groq Models</label>
                <div className="space-y-2">
                  {[
                    'groq/compound',
                    'openai/gpt-oss-120b',
                    'groq/compound-mini',
                    'qwen/qwen3.6-27b',
                    'openai/gpt-oss-20b'
                  ].map(model => (
                    <label key={model} className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={enabledGroqModels.includes(model)} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEnabledGroqModels([...enabledGroqModels, model]);
                          } else {
                            setEnabledGroqModels(enabledGroqModels.filter(m => m !== model));
                          }
                        }}
                        className="w-4 h-4 rounded bg-pc-dark border-pc-border text-pc-green focus:ring-pc-green focus:ring-offset-pc-black"
                      />
                      <span className="text-sm text-white">{model}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {groqTestResults.length > 0 && (
                <div className="mb-4 space-y-2">
                  {groqTestResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between bg-pc-dark px-3 py-2 rounded-lg text-xs border border-pc-border">
                      <span className="text-white">{res.model}</span>
                      {res.status === 'testing' && <span className="text-yellow-400 animate-pulse">Testing...</span>}
                      {res.status === 'success' && <span className="text-pc-green font-bold flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>OK</span>}
                      {res.status === 'error' && <span className="text-red-400 font-bold flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>Fail</span>}
                    </div>
                  ))}
                </div>
              )}

            
            <div className="flex gap-2">
              <button type="button" onClick={handleTestGroq} disabled={testingModel || !groqEnabled} className="flex-1 px-4 py-2 bg-pc-dark border border-pc-border text-white hover:border-pc-green rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                {testingModel ? 'Testing...' : 'Test Enabled Models'}
              </button>
              <button type="button" onClick={handlePromptSubmit} disabled={loadingPrompt} className="flex-1 px-4 py-2 bg-pc-green/10 text-pc-green hover:bg-pc-green hover:text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                Save Settings
              </button>
            </div>
            </div>
          </div>

          <form onSubmit={handlePromptSubmit} className="space-y-4 pt-4 border-t border-pc-border">
            <div>
              <label className="block text-sm font-medium text-pc-muted mb-1">Primary AI Provider</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green appearance-none"
              >
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
              </select>
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

            <button type="submit" disabled={loadingPrompt} className="btn-primary w-full py-3">
              {loadingPrompt ? 'Saving...' : 'Update Settings'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
