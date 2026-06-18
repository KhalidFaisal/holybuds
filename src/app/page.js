import Link from 'next/link';
import prisma from '@/lib/prisma';
import HomeClient from './HomeClient';
import { withProductDiscounts } from '@/lib/discounts';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true, isVisible: true, stock: { gt: 0 } },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  const flowerProducts = await prisma.product.findMany({
    where: { category: 'FLOWER', stock: { gt: 0 } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  const edibleProducts = await prisma.product.findMany({
    where: { category: 'EDIBLE', stock: { gt: 0 } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  const enrichedFeatured = await withProductDiscounts(featuredProducts);
  const enrichedFlower = await withProductDiscounts(flowerProducts);
  const enrichedEdible = await withProductDiscounts(edibleProducts);

  const activeBanners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <HomeClient
      featuredProducts={JSON.parse(JSON.stringify(enrichedFeatured))}
      flowerProducts={JSON.parse(JSON.stringify(enrichedFlower))}
      edibleProducts={JSON.parse(JSON.stringify(enrichedEdible))}
      banners={JSON.parse(JSON.stringify(activeBanners))}
    />
  );
}
