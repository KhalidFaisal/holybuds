import prisma from '@/lib/prisma';
import MenuClient from './MenuClient';
import { withProductDiscounts } from '@/lib/discounts';

export default async function MenuPage({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category || null;
  const search = sp?.search || null;
  const effect = sp?.effect || null;

  const where = { isVisible: true };
  if (category) where.category = category;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  const enrichedProducts = await withProductDiscounts(products);

  return (
    <MenuClient
      products={JSON.parse(JSON.stringify(enrichedProducts))}
      categories={JSON.parse(JSON.stringify(categories))}
      initialCategory={category}
      initialSearch={search}
      initialEffect={effect}
    />
  );
}
