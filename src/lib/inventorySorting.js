import React from 'react';

/**
 * Category prioritization and matching definition
 * Strictly NO emojis - uses SVG icons matching HolyBuds design system.
 */
export const CATEGORY_DEFINITIONS = [
  { key: 'flowers', rank: 1, label: 'Flowers', iconType: 'flower' },
  { key: 'vapes', rank: 2, label: 'Vapes', iconType: 'vape' },
  { key: 'edibles', rank: 3, label: 'Edibles', iconType: 'edible' },
  { key: 'pre-rolls', rank: 4, label: 'Pre-rolls', iconType: 'preroll' },
  { key: 'wax', rank: 5, label: 'Wax', iconType: 'wax' },
  { key: 'accessories', rank: 6, label: 'Accessories', iconType: 'accessory' },
  { key: 'clothing', rank: 7, label: 'Clothing', iconType: 'clothing' },
];

/**
 * Inspects a product's primary category, categories JSON array, and name
 * to identify its category rank and label.
 */
export function getCategoryMeta(product) {
  const cat = (product?.category || '').toLowerCase().trim();
  let catsList = [];
  try {
    catsList = Array.isArray(product?.categories)
      ? product.categories
      : JSON.parse(product?.categories || '[]');
  } catch (e) {
    catsList = [];
  }

  const allSlugs = [cat, ...catsList.map(c => String(c).toLowerCase().trim())].filter(Boolean);
  const name = (product?.name || '').toLowerCase();

  // 1. Flowers
  if (allSlugs.some(s => s === 'flowers' || s === 'flower') || cat.includes('flower') || cat === 'buds') {
    return { rank: 1, label: 'Flowers', iconType: 'flower' };
  }

  // 2. Vapes
  if (
    allSlugs.some(s => s === 'vapes' || s === 'vape') ||
    cat.includes('vape') ||
    cat.includes('cart') ||
    cat.includes('disposable') ||
    name.includes('disposable') ||
    name.includes('vape') ||
    name.includes('cart')
  ) {
    return { rank: 2, label: 'Vapes', iconType: 'vape' };
  }

  // 3. Edibles
  if (
    allSlugs.some(s => s === 'edibles' || s === 'edible') ||
    cat.includes('edible') ||
    cat.includes('gummi') ||
    cat.includes('chocolate') ||
    cat.includes('candy')
  ) {
    return { rank: 3, label: 'Edibles', iconType: 'edible' };
  }

  // 4. Pre-rolls
  if (
    allSlugs.some(s => s === 'pre-rolls' || s === 'prerolls' || s === 'preroll') ||
    cat.includes('preroll') ||
    cat.includes('pre-roll') ||
    name.includes('preroll') ||
    name.includes('pre-roll')
  ) {
    return { rank: 4, label: 'Pre-rolls', iconType: 'preroll' };
  }

  // 5. Wax / Concentrates
  if (
    allSlugs.some(s => s === 'wax' || s === 'concentrates' || s === 'extract') ||
    cat.includes('wax') ||
    cat.includes('concentrate') ||
    cat.includes('shatter') ||
    cat.includes('rosin') ||
    cat.includes('resin') ||
    cat.includes('dab')
  ) {
    return { rank: 5, label: 'Wax', iconType: 'wax' };
  }

  // 6. Accessories
  if (
    allSlugs.some(s => s === 'accessories' || s === 'accessory') ||
    cat.includes('accessor') ||
    cat.includes('battery') ||
    cat.includes('gear')
  ) {
    return { rank: 6, label: 'Accessories', iconType: 'accessory' };
  }

  // 7. Clothing
  if (allSlugs.some(s => s === 'clothing' || s === 'apparel') || cat.includes('cloth') || cat.includes('apparel')) {
    return { rank: 7, label: 'Clothing', iconType: 'clothing' };
  }

  // 8. Other
  return {
    rank: 99,
    label: cat ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase() : 'Other',
    iconType: 'other',
  };
}

/**
 * Groups items into ordered categories, then sorts items within each category
 * strictly in alphabetical order (A to Z) by product name.
 *
 * @param {Array} items - Array of box items with { product: { name, category, ... }, expectedQuantity, ... }
 * @returns {Array} - Array of grouped category objects:
 *   [{ label: 'Flowers', iconType: 'flower', rank: 1, totalQuantity: 12, items: [...] }, ...]
 */
export function groupAndSortBoxItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groupsMap = {};

  for (const item of items) {
    const meta = getCategoryMeta(item.product);
    if (!groupsMap[meta.label]) {
      groupsMap[meta.label] = {
        label: meta.label,
        iconType: meta.iconType,
        rank: meta.rank,
        totalQuantity: 0,
        items: [],
      };
    }
    groupsMap[meta.label].items.push(item);
    groupsMap[meta.label].totalQuantity += (item.expectedQuantity ?? item.quantity ?? 1);
  }

  // Sort category groups by defined priority rank
  const sortedGroups = Object.values(groupsMap).sort((a, b) => a.rank - b.rank);

  // Sort items within each category alphabetically (A -> Z)
  for (const group of sortedGroups) {
    group.items.sort((a, b) => {
      const nameA = a.product?.name || a.name || '';
      const nameB = b.product?.name || b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  return sortedGroups;
}

/**
 * Pure SVG Category Icon Component (Strictly NO Emojis)
 */
export function CategoryIcon({ type = 'other', className = 'w-4 h-4' }) {
  switch (type) {
    case 'flower':
      // Cannabis leaf / nature icon
      return (
        <svg className={`${className} text-pc-green shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
        </svg>
      );

    case 'vape':
      // Vapor / vape cartridge icon
      return (
        <svg className={`${className} text-cyan-400 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18m6-18v18M6 8h12M6 16h12" />
        </svg>
      );

    case 'edible':
      // Edibles package / gummies icon
      return (
        <svg className={`${className} text-amber-400 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );

    case 'preroll':
      // Pre-roll icon
      return (
        <svg className={`${className} text-emerald-400 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m-15 0 15 15" />
        </svg>
      );

    case 'wax':
      // Wax / dab flame icon
      return (
        <svg className={`${className} text-yellow-500 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </svg>
      );

    case 'accessory':
      // Gear / accessory spark icon
      return (
        <svg className={`${className} text-purple-400 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      );

    case 'clothing':
      // Apparel tag icon
      return (
        <svg className={`${className} text-blue-400 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      );

    default:
      // Generic clean package icon
      return (
        <svg className={`${className} text-pc-muted shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      );
  }
}
