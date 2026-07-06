import Link from 'next/link';
import prisma from '@/lib/prisma';
import HomeClient from './HomeClient';
import { withProductDiscounts } from '@/lib/discounts';

export const dynamic = 'force-dynamic';

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
  const allActiveProducts = await prisma.product.findMany({
    where: { isVisible: true, stock: { gt: 0 } },
    orderBy: { createdAt: 'desc' }
  });

  const enrichedProducts = await withProductDiscounts(allActiveProducts);

  // 1. Deals
  const allDeals = enrichedProducts.filter(p => p.eligibleDiscountNames && p.eligibleDiscountNames.length > 0);
  const deals = shuffleHourly([...allDeals]).slice(0, 12);

  // 2. Staff Picks (featured)
  const allStaffPicks = enrichedProducts.filter(p => p.featured);
  const staffPicks = shuffleHourly([...allStaffPicks]).slice(0, 12);

  // 3. New Arrivals
  const newArrivals = enrichedProducts.slice(0, 12);

  // 4. Best Sellers
  const topOrderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 12,
  });
  
  const bestSellerIds = topOrderItems.map(i => i.productId);
  let bestSellers = bestSellerIds
    .map(id => enrichedProducts.find(p => p.id === id))
    .filter(Boolean);

  // Backfill best sellers if we don't have enough data
  if (bestSellers.length < 12) {
    const missing = 12 - bestSellers.length;
    const backfill = enrichedProducts.filter(p => !bestSellerIds.includes(p.id)).slice(0, missing);
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

  return (
    <HomeClient
      deals={JSON.parse(JSON.stringify(deals))}
      staffPicks={JSON.parse(JSON.stringify(staffPicks))}
      newArrivals={JSON.parse(JSON.stringify(newArrivals))}
      bestSellers={JSON.parse(JSON.stringify(bestSellers))}
      categories={JSON.parse(JSON.stringify(categories))}
      banners={JSON.parse(JSON.stringify(activeBanners))}
    />
  );
}
