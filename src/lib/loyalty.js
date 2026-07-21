export const LOYALTY_REWARDS = [
  { id: '500_acc', points: 500, label: "$5 Off Any Accessory", type: "FIXED", category: "accessories", value: 5 },
  { id: '1000_acc', points: 1000, label: "10% Off One Accessory Order", type: "PERCENT", category: "accessories", value: 10 },
  { id: '2000_any', points: 2000, label: "$15 Off Any Order", type: "FIXED", value: 15 },
  { id: '3500_free', points: 3500, label: "Free Cart or Edible", type: "FREE_LOWEST", categories: ["vapes", "edibles"] },
  { id: '5000_any', points: 5000, label: "$35 Off Any Order", type: "FIXED", value: 35 },
  { id: '7500_any', points: 7500, label: "Free Premium Accessory or $50 Off", type: "FREE_LOWEST", categories: ["accessories"], maxValue: 50 },
  { id: '10000_free', points: 10000, label: "Free 1/2", type: "FREE_LOWEST", categories: ["flowers"] }
];

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
