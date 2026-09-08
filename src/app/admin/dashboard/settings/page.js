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
  
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [groqTestResults, setGroqTestResults] = useState([]);

  const [aiStaffPicksEnabled, setAiStaffPicksEnabled] = useState(false);
  const [loadingAiPicks, setLoadingAiPicks] = useState(false);
  const [messageAiPicks, setMessageAiPicks] = useState('');
  const [generatingAiPicks, setGeneratingAiPicks] = useState(false);

  const [driverReferralReward, setDriverReferralReward] = useState(10);
  const [customerReferralDiscount, setCustomerReferralDiscount] = useState(5);
  const [referralPromoEndDate, setReferralPromoEndDate] = useState('');
  const [promoCustomerReferralCredit, setPromoCustomerReferralCredit] = useState(10);
  const [promoCustomerReferralDiscount, setPromoCustomerReferralDiscount] = useState(10);
  const [standardCustomerReferralPoints, setStandardCustomerReferralPoints] = useState(500);
  const [customerReferralMinSpend, setCustomerReferralMinSpend] = useState(100);
  const [driverBonusThreshold, setDriverBonusThreshold] = useState(10);
  const [driverBonusAmount, setDriverBonusAmount] = useState(100);
  const [loadingDriverPromo, setLoadingDriverPromo] = useState(false);
  const [messageDriverPromo, setMessageDriverPromo] = useState('');
  const [loadingCustomerPromo, setLoadingCustomerPromo] = useState(false);
  const [messageCustomerPromo, setMessageCustomerPromo] = useState('');

  const [wholesalePassword, setWholesalePassword] = useState('');
  const [wholesaleConfirm, setWholesaleConfirm] = useState('');
  const [currentWholesalePassword, setCurrentWholesalePassword] = useState('Onlyholy');
  const [loadingWholesale, setLoadingWholesale] = useState(false);
  const [messageWholesale, setMessageWholesale] = useState('');

  const isPromoActive = useMemo(() => {
    if (!referralPromoEndDate) return false;
    const end = new Date(referralPromoEndDate + 'T23:59:59');
    return end > new Date();
  }, [referralPromoEndDate]);

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
              const parsed = JSON.parse(data.enabledGroqModels);
              const validModels = [
                'groq/compound',
                'openai/gpt-oss-120b',
                'groq/compound-mini',
                'qwen/qwen3.6-27b',
                'openai/gpt-oss-20b'
              ];
              setEnabledGroqModels(parsed.filter(m => validModels.includes(m)));
            } catch (e) {}
          }
          
          if (data.loyaltyEnabled !== undefined) setLoyaltyEnabled(data.loyaltyEnabled);
          if (data.pointsPerDollar !== undefined) setPointsPerDollar(data.pointsPerDollar);
          if (data.signupBonus !== undefined) setSignupBonus(data.signupBonus);
          if (data.aiStaffPicksEnabled !== undefined) setAiStaffPicksEnabled(data.aiStaffPicksEnabled);
          if (data.driverReferralReward !== undefined) setDriverReferralReward(data.driverReferralReward);
          if (data.customerReferralDiscount !== undefined) setCustomerReferralDiscount(data.customerReferralDiscount);
          
          if (data.referralPromoEndDate) {
            // Convert to YYYY-MM-DD for input type="date"
            setReferralPromoEndDate(data.referralPromoEndDate.split('T')[0]);
          } else {
            setReferralPromoEndDate('');
          }
          if (data.promoCustomerReferralCredit !== undefined) setPromoCustomerReferralCredit(data.promoCustomerReferralCredit);
          if (data.promoCustomerReferralDiscount !== undefined) setPromoCustomerReferralDiscount(data.promoCustomerReferralDiscount);
          if (data.standardCustomerReferralPoints !== undefined) setStandardCustomerReferralPoints(data.standardCustomerReferralPoints);
          if (data.customerReferralMinSpend !== undefined) setCustomerReferralMinSpend(data.customerReferralMinSpend);
          
          if (data.driverBonusThreshold !== undefined) setDriverBonusThreshold(data.driverBonusThreshold);
          if (data.driverBonusAmount !== undefined) setDriverBonusAmount(data.driverBonusAmount);
          if (data.wholesalePassword) setCurrentWholesalePassword(data.wholesalePassword);
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
        setMessagePrompt('Settings updated successfully.');
        if (openRouterApiKey && openRouterApiKey !== '••••••••••••••••') setOpenRouterApiKey('••••••••••••••••');
        if (groqApiKey && groqApiKey !== '••••••••••••••••') setGroqApiKey('••••••••••••••••');
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
    setTestingOpenRouter(true);
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
      setTestingOpenRouter(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
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
    
    setTestingGroq(false);
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

  const handleWholesaleSubmit = async (e) => {
    e.preventDefault();
    if (wholesalePassword !== wholesaleConfirm) {
      setMessageWholesale('Passwords do not match.');
      return;
    }

    setLoadingWholesale(true);
    setMessageWholesale('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ wholesalePassword }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessageWholesale('Wholesale password updated successfully.');
        setCurrentWholesalePassword(data.wholesalePassword || wholesalePassword);
        setWholesalePassword('');
        setWholesaleConfirm('');
      } else {
        const data = await res.json();
        setMessageWholesale(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageWholesale('An error occurred.');
    } finally {
      setLoadingWholesale(false);
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
          driverBonusThreshold: parseInt(driverBonusThreshold, 10),
          driverBonusAmount: parseFloat(driverBonusAmount)
        }),
      });

      if (res.ok) {
        setMessageDriverPromo('Driver Referral settings updated successfully.');
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

  const handleCustomerPromoSubmit = async (e) => {
    e.preventDefault();
    setLoadingCustomerPromo(true);
    setMessageCustomerPromo('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          referralPromoEndDate: referralPromoEndDate || null,
          promoCustomerReferralCredit: parseFloat(promoCustomerReferralCredit),
          promoCustomerReferralDiscount: parseFloat(promoCustomerReferralDiscount),
          standardCustomerReferralPoints: parseInt(standardCustomerReferralPoints, 10),
          customerReferralMinSpend: parseFloat(customerReferralMinSpend)
        }),
      });

      if (res.ok) {
        setMessageCustomerPromo('Customer Referral & Promo settings updated successfully.');
      } else {
        const data = await res.json();
        setMessageCustomerPromo(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setMessageCustomerPromo('An error occurred.');
    } finally {
      setLoadingCustomerPromo(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Settings</h1>
          <p className="text-pc-muted">Manage global site settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {/* ROW 1: Customer Referrals & Promo + Driver Referral Program + Loyalty & Rewards */}
      {/* Customer Referrals & Promo Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          Customer Referrals & Promo
        </h2>
        <p className="text-pc-muted mb-4 text-sm min-h-[3rem]">
          Run limited-time refer-a-friend promotions with store credit and discounts. When the promo ends, rewards automatically revert to standard loyalty points.
        </p>

        {/* Promo Status Pill */}
        {isPromoActive ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Weekly Promo Active</span>
            </div>
            <span className="text-xs text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/20">
              Ends {referralPromoEndDate}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-pc-black border border-pc-border mb-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex rounded-full h-2 w-2 bg-pc-muted/60"></span>
              <span className="text-xs font-medium text-pc-muted uppercase tracking-wider">Standard Loyalty Mode</span>
            </div>
            <span className="text-[11px] text-pc-muted font-medium">Reverts to Points</span>
          </div>
        )}

        <form onSubmit={handleCustomerPromoSubmit} className="space-y-4 flex flex-col flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider">
                  Promo End Date
                </label>
                {referralPromoEndDate && (
                  <button
                    type="button"
                    onClick={() => setReferralPromoEndDate('')}
                    className="text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Clear Promo
                  </button>
                )}
              </div>
              <input
                type="date"
                value={referralPromoEndDate}
                onChange={(e) => setReferralPromoEndDate(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Leave blank for standard points mode</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Friend Discount ($ off)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={promoCustomerReferralDiscount}
                onChange={(e) => setPromoCustomerReferralDiscount(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Discount off referee&apos;s first order</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Promo Referrer Credit ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={promoCustomerReferralCredit}
                onChange={(e) => setPromoCustomerReferralCredit(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Store credit earned while promo is active</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Standard Reward (Points)
              </label>
              <input
                type="number"
                min="0"
                value={standardCustomerReferralPoints}
                onChange={(e) => setStandardCustomerReferralPoints(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Points awarded when no promo active</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Minimum Order Spend Requirement ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customerReferralMinSpend}
                onChange={(e) => setCustomerReferralMinSpend(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">
                Referees must place an actual qualifying order of at least this amount to unlock their discount &amp; award referrer credit/points.
              </p>
            </div>
          </div>

          {messageCustomerPromo && (
            <div className={`p-3 rounded-lg text-sm mt-4 ${messageCustomerPromo.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageCustomerPromo}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingCustomerPromo}
              className="btn-primary w-full py-3"
            >
              {loadingCustomerPromo ? 'Saving...' : 'Update Customer Promo'}
            </button>
          </div>
        </form>
      </div>

      {/* Driver Referral Program Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Driver Referral Program
        </h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Configure commission payouts for drivers who refer new customers, and bonuses for reaching referral milestones.
        </p>

        <form onSubmit={handleDriverPromoSubmit} className="space-y-4 flex flex-col flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Driver Reward ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={driverReferralReward}
                onChange={(e) => setDriverReferralReward(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Per successful driver referral</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Customer Discount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customerReferralDiscount}
                onChange={(e) => setCustomerReferralDiscount(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Off first order via driver code</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Bonus Threshold
              </label>
              <input
                type="number"
                min="1"
                value={driverBonusThreshold}
                onChange={(e) => setDriverBonusThreshold(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Referral milestone (e.g., 10 orders)</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">
                Milestone Bonus ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={driverBonusAmount}
                onChange={(e) => setDriverBonusAmount(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green transition-colors"
                required
              />
              <p className="text-[11px] text-pc-muted/70 mt-1">Payout upon reaching milestone</p>
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
              {loadingDriverPromo ? 'Saving...' : 'Update Driver Referrals'}
            </button>
          </div>
        </form>
      </div>

      {/* Loyalty & Rewards Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          Loyalty & Rewards
        </h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
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

      {/* ROW 2: Password & Security Settings (Site Access, Admin Dashboard, Wholesale) */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4">Site Access Password</h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Change the password required for users to enter the site. The current password is <span className="text-pc-green font-bold font-mono px-1">{currentPassword}</span>.
        </p>

        <form onSubmit={handleSiteSubmit} className="space-y-4 flex flex-col flex-grow">
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

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingSite}
              className="btn-primary w-full py-3"
            >
              {loadingSite ? 'Saving...' : 'Update Site Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4">Admin Dashboard Password</h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Change the password you use to log into this admin dashboard.
        </p>

        <form onSubmit={handleAdminSubmit} className="space-y-4 flex flex-col flex-grow">
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

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingAdmin}
              className="btn-secondary w-full py-3"
            >
              {loadingAdmin ? 'Saving...' : 'Update Admin Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4">Wholesale Access Password</h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Change the passcode required for users to enter the wholesale section. The current passcode is <span className="text-pc-green font-bold font-mono px-1">{currentWholesalePassword}</span>.
        </p>

        <form onSubmit={handleWholesaleSubmit} className="space-y-4 flex flex-col flex-grow">
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">New Wholesale Passcode</label>
            <input
              type="password"
              value={wholesalePassword}
              onChange={(e) => setWholesalePassword(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-pc-muted mb-1">Confirm Wholesale Passcode</label>
            <input
              type="password"
              value={wholesaleConfirm}
              onChange={(e) => setWholesaleConfirm(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pc-green"
              required
              minLength={4}
            />
          </div>

          {messageWholesale && (
            <div className={`p-3 rounded-lg text-sm ${messageWholesale.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {messageWholesale}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingWholesale}
              className="btn-secondary w-full py-3"
            >
              {loadingWholesale ? 'Saving...' : 'Update Wholesale Passcode'}
            </button>
          </div>
        </form>
      </div>

      {/* ROW 3: AI Auto-Select Staff Picks + Timezone */}
      {/* AI Staff Picks Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-purple-400"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.86-12A2 2 0 0 1 15 2a22 22 0 0 1 12 3.86c0 1.22-.78 2.36-1.93 2.53A22 22 0 0 1 15 12z"/><path d="M16 11c1.5 0 3-.5 3-3s-1.5-3-3-3-3 1.5-3 3 1.5 3 3 3z"/></svg>
          AI Auto-Select Staff Picks
        </h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Let AI automatically pick 10 exciting, diverse products to feature as &quot;Staff Picks&quot; on your homepage. 
          When enabled, picks automatically update weekly.
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

      {/* Timezone Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 flex flex-col lg:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Timezone
        </h2>
        <p className="text-pc-muted mb-6 text-sm min-h-[3rem]">
          Set global timezone. Current timezone: <span className="text-pc-green font-bold font-mono px-1">{currentTimezone}</span>.
        </p>

        <form onSubmit={handleTimezoneSubmit} className="space-y-4 flex flex-col flex-grow">
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

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={loadingTimezone}
              className="btn-primary w-full py-3"
            >
              {loadingTimezone ? 'Saving...' : 'Update Timezone'}
            </button>
          </div>
        </form>
      </div>

      {/* ROW 4: AI Settings Section */}
      <div className="bg-pc-dark border border-pc-border rounded-2xl p-6 md:col-span-2 lg:col-span-3">
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
                <button type="button" onClick={handleTestOpenRouter} disabled={testingOpenRouter || !openRouterEnabled} className="flex-1 px-4 py-2 bg-pc-dark border border-pc-border text-white hover:border-pc-green rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                  {testingOpenRouter ? 'Testing...' : 'Test OpenRouter'}
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
              <button type="button" onClick={handleTestGroq} disabled={testingGroq || !groqEnabled} className="flex-1 px-4 py-2 bg-pc-dark border border-pc-border text-white hover:border-pc-green rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                {testingGroq ? 'Testing...' : 'Test Enabled Models'}
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
