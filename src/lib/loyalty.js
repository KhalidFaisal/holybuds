export const LOYALTY_TIERS = [
  {
    tier: 1,
    id: 'green',
    name: 'Green Member',
    points: 0,
    minOrders: 0,
    type: 'green',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-600/30',
    iconColor: 'text-emerald-800',
    description: 'Welcome tier for all Holy Buds members',
    rewardLabel: 'Menu Access & Point Accumulation'
  },
  {
    tier: 2,
    id: 'bronze',
    name: 'Bronze Member',
    points: 500,
    minOrders: 5,
    type: 'bronze',
    badgeClass: 'bg-amber-800/15 text-amber-900 border-amber-700/30',
    iconColor: 'text-amber-900',
    description: 'Earned at 500 points or 5 orders',
    rewardId: '500_acc',
    rewardLabel: '$5 Off Any Accessory'
  },
  {
    tier: 3,
    id: 'silver',
    name: 'Silver Connoisseur',
    points: 1000,
    minOrders: 10,
    type: 'silver',
    badgeClass: 'bg-slate-500/15 text-slate-800 border-slate-500/30',
    iconColor: 'text-slate-700',
    description: 'Earned at 1,000 points or 10 orders',
    rewardId: '1000_acc',
    rewardLabel: '10% Off One Accessory Order'
  },
  {
    tier: 4,
    id: 'gold',
    name: 'Gold Reserve',
    points: 2000,
    minOrders: 20,
    type: 'gold',
    badgeClass: 'bg-amber-400/25 text-amber-900 border-amber-600/40',
    iconColor: 'text-amber-800',
    description: 'Earned at 2,000 points or 20 orders',
    rewardId: '2000_any',
    rewardLabel: '$15 Off Any Order'
  },
  {
    tier: 5,
    id: 'platinum',
    name: 'Platinum Curator',
    points: 3500,
    minOrders: 35,
    type: 'platinum',
    badgeClass: 'bg-cyan-500/15 text-cyan-900 border-cyan-600/30',
    iconColor: 'text-cyan-800',
    description: 'Earned at 3,500 points or 35 orders',
    rewardId: '3500_free',
    rewardLabel: 'Free Cart or Edible'
  },
  {
    tier: 6,
    id: 'emerald',
    name: 'Emerald Elite',
    points: 5000,
    minOrders: 50,
    type: 'emerald',
    badgeClass: 'bg-emerald-600/15 text-emerald-900 border-emerald-600/40',
    iconColor: 'text-emerald-800',
    description: 'Earned at 5,000 points or 50 orders',
    rewardId: '5000_any',
    rewardLabel: '$35 Off Any Order'
  },
  {
    tier: 7,
    id: 'ruby',
    name: 'Ruby Master',
    points: 7500,
    minOrders: 75,
    type: 'ruby',
    badgeClass: 'bg-rose-500/15 text-rose-900 border-rose-500/35',
    iconColor: 'text-rose-800',
    description: 'Earned at 7,500 points or 75 orders',
    rewardId: '7500_any',
    rewardLabel: 'Free Premium Accessory or $50 Off'
  },
  {
    tier: 8,
    id: 'diamond',
    name: 'Diamond VIP',
    points: 10000,
    minOrders: 100,
    type: 'diamond',
    badgeClass: 'bg-purple-500/15 text-purple-900 border-purple-500/35',
    iconColor: 'text-purple-800',
    description: 'Earned at 10,000 points or 100 orders',
    rewardId: '10000_free',
    rewardLabel: 'Free 1/2 oz Flower'
  }
];

export const LOYALTY_REWARDS = [
  { id: '500_acc', points: 500, label: "$5 Off Any Accessory", type: "FIXED", category: "accessories", value: 5, tierNumber: 2, tierName: "Bronze Member" },
  { id: '1000_acc', points: 1000, label: "10% Off One Accessory Order", type: "PERCENT", category: "accessories", value: 10, tierNumber: 3, tierName: "Silver Connoisseur" },
  { id: '2000_any', points: 2000, label: "$15 Off Any Order", type: "FIXED", value: 15, tierNumber: 4, tierName: "Gold Reserve" },
  { id: '3500_free', points: 3500, label: "Free Cart or Edible", type: "FREE_LOWEST", categories: ["vapes", "edibles"], tierNumber: 5, tierName: "Platinum Curator" },
  { id: '5000_any', points: 5000, label: "$35 Off Any Order", type: "FIXED", value: 35, tierNumber: 6, tierName: "Emerald Elite" },
  { id: '7500_any', points: 7500, label: "Free Premium Accessory or $50 Off", type: "FREE_LOWEST", categories: ["accessories"], maxValue: 50, tierNumber: 7, tierName: "Ruby Master" },
  { id: '10000_free', points: 10000, label: "Free 1/2", type: "FREE_LOWEST", categories: ["flowers"], tierNumber: 8, tierName: "Diamond VIP" }
];

export function getTierInfo(tierPoints = 0, totalOrders = 0) {
  const safePoints = Math.max(0, Number(tierPoints) || 0);
  const safeOrders = Math.max(0, Number(totalOrders) || 0);

  let currentTierIndex = 0;
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    const t = LOYALTY_TIERS[i];
    if (safePoints >= t.points || (t.minOrders > 0 && safeOrders >= t.minOrders)) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = LOYALTY_TIERS[currentTierIndex];
  const nextTier = currentTierIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentTierIndex + 1] : null;

  let pointsNeeded = 0;
  let ordersNeeded = 0;
  let progressPct = 100;

  if (nextTier) {
    pointsNeeded = Math.max(0, nextTier.points - safePoints);
    ordersNeeded = Math.max(0, nextTier.minOrders - safeOrders);

    const prevPoints = currentTier.points;
    const tierRange = nextTier.points - prevPoints;
    const pointsProgress = tierRange > 0 ? Math.min(100, Math.max(0, ((safePoints - prevPoints) / tierRange) * 100)) : 100;

    const prevOrders = currentTier.minOrders;
    const ordersRange = nextTier.minOrders - prevOrders;
    const ordersProgress = ordersRange > 0 ? Math.min(100, Math.max(0, ((safeOrders - prevOrders) / ordersRange) * 100)) : 100;

    progressPct = Math.min(100, Math.round(Math.max(pointsProgress, ordersProgress)));
  }

  return {
    ...currentTier,
    tierIndex: currentTierIndex,
    currentTier,
    nextTier,
    pointsNeeded,
    ordersNeeded,
    progressPct,
    isMaxTier: !nextTier
  };
}

export function calcRewardDiscount(reward, items) {
  if (!reward) return 0;
  
  if (reward.type === 'FIXED') {
    if (reward.category) {
      const hasCat = items.some(i => i.category && i.category.toUpperCase().includes(reward.category.toUpperCase()));
      return hasCat ? reward.value : 0;
    }
    return reward.value;
  }
  
  if (reward.type === 'PERCENT') {
    if (reward.category) {
      const catTotal = items.filter(i => i.category && i.category.toUpperCase().includes(reward.category.toUpperCase()))
                            .reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return catTotal * (reward.value / 100);
    }
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    return total * (reward.value / 100);
  }

  if (reward.type === 'FREE_LOWEST') {
    let eligibleItems = items;
    if (reward.categories) {
      eligibleItems = items.filter(i => i.category && reward.categories.some(c => i.category.toUpperCase().includes(c.toUpperCase())));
    }
    if (eligibleItems.length === 0) return 0;
    
    const lowest = eligibleItems.reduce((min, i) => i.price < min.price ? i : min, eligibleItems[0]);
    if (reward.maxValue && lowest.price > reward.maxValue) {
      return reward.maxValue;
    }
    return lowest.price;
  }
  
  return 0;
}
