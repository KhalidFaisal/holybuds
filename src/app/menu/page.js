import prisma from '@/lib/prisma';
import MenuClient from './MenuClient';
import { withProductDiscounts } from '@/lib/discounts';
import { cookies } from 'next/headers';

export default async function MenuPage({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category || null;
  const search = sp?.search || null;
  const effect = sp?.effect || null;

  const cookieStore = await cookies();
  const hasWholesaleAccess = cookieStore.get('wholesale_access')?.value === 'true';

  let wholesaleLocked = false;
  const where = { isVisible: true };
  
  if (category) {
    if (category.toLowerCase() === 'wholesale' && !hasWholesaleAccess) {
      wholesaleLocked = true;
      // Don't fetch any products if wholesale is locked
      where.id = 'none'; // Impossible condition to return 0 products
    } else {
      where.category = category;
    }
  } else {
    // Exclude wholesale from ALL categories if they don't have access
    if (!hasWholesaleAccess) {
      where.category = { not: 'wholesale' };
    }
  }

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
      wholesaleLocked={wholesaleLocked}
    />
  );
}
