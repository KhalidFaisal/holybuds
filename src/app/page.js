import Link from 'next/link';
import prisma from '@/lib/prisma';
import HomeClient from './HomeClient';
import { withProductDiscounts } from '@/lib/discounts';
import AIUpdaterTrigger from '@/components/AIUpdaterTrigger';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

export const metadata = {
  title: 'HolyBuds | Premium Long Island Cannabis Delivery & Dispensary',
  description: 'Fast, discreet same-day weed delivery across Long Island (Nassau & Suffolk County). Browse our curated menu of top-shelf flower, edibles, vape carts, and concentrates.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HolyBuds | Premium Long Island Cannabis Delivery & Dispensary',
    description: 'Fast, discreet same-day weed delivery across Long Island (Nassau & Suffolk County). Browse our curated menu of top-shelf flower, edibles, vape carts, and concentrates.',
    url: siteUrl,
    siteName: 'HolyBuds Dispensary',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'HolyBuds Cannabis Dispensary Long Island',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HolyBuds | Premium Long Island Cannabis Delivery & Dispensary',
    description: 'Fast, discreet same-day weed delivery across Long Island (Nassau & Suffolk County). Browse our curated menu of top-shelf flower, edibles, vape carts, and concentrates.',
    images: [`${siteUrl}/og-image.jpg`],
  },
};

function seededRandom(seed) {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleHourly(array) {
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + d.getHours();
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(seededRandom(seed++) * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default async function HomePage() {
  const session = await auth();
  let customer = null;
  if (session?.user?.id) {
    customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });
  }

  const allActiveProducts = await prisma.product.findMany({
    where: { 
      isVisible: true, 
      stock: { gt: 0 },
      NOT: [
        { category: { equals: 'wholesale', mode: 'insensitive' } },
        { categories: { contains: '"wholesale"' } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  const enrichedProducts = await withProductDiscounts(allActiveProducts);
  const retailProducts = enrichedProducts.filter(p => {
    if (p.category?.toLowerCase() === 'wholesale') return false;
    try {
      const cats = JSON.parse(p.categories || '[]');
      if (cats.some(c => c.toLowerCase() === 'wholesale')) return false;
    } catch(e) {}
    return true;
  });

  // 1. Deals
  const allDeals = retailProducts.filter(p => p.eligibleDiscountNames && p.eligibleDiscountNames.length > 0);
  const deals = shuffleHourly([...allDeals]).slice(0, 12);

  // 2. Staff Picks (featured)
  const allStaffPicks = retailProducts.filter(p => p.featured);
  const staffPicks = shuffleHourly([...allStaffPicks]).slice(0, 12);

  // 3. New Arrivals (New Since Your Last Visit)
  const newArrivals = retailProducts.slice(0, 10);

  // 4. Best Sellers
  const topOrderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 50,
  });
  
  const bestSellerIds = topOrderItems.map(i => i.productId);
  let bestSellers = bestSellerIds
    .map(id => retailProducts.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 10);

  // Backfill best sellers if we don't have enough data
  if (bestSellers.length < 10) {
    const missing = 10 - bestSellers.length;
    const backfill = retailProducts.filter(p => !bestSellerIds.includes(p.id)).slice(0, missing);
    bestSellers.push(...backfill);
  }

  let categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  if (categories.length === 0) {
    try {
      await prisma.category.createMany({
        data: [
          { name: 'Flower', slug: 'FLOWER', order: 1 },
          { name: 'Edible', slug: 'EDIBLE', order: 2 }
        ],
        skipDuplicates: true
      });
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
    } catch (err) {
      console.error("Failed to seed categories:", err);
    }
  }

  const activeBanners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  
  let needsAiUpdate = false;
  if (settings?.aiStaffPicksEnabled) {
    const lastUpdate = settings.aiStaffPicksLastUpdate;
    if (!lastUpdate || (new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24) >= 7) {
      needsAiUpdate = true;
    }
  }

  return (
    <>
      {needsAiUpdate && <AIUpdaterTrigger />}
      <HomeClient
        customer={customer ? JSON.parse(JSON.stringify(customer)) : null}
        deals={JSON.parse(JSON.stringify(deals))}
        staffPicks={JSON.parse(JSON.stringify(staffPicks))}
        newArrivals={JSON.parse(JSON.stringify(newArrivals))}
        bestSellers={JSON.parse(JSON.stringify(bestSellers))}
        categories={JSON.parse(JSON.stringify(categories))}
        banners={JSON.parse(JSON.stringify(activeBanners))}
      />
    </>
  );
}
