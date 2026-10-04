import prisma from '@/lib/prisma';
import MenuClient from './MenuClient';
import { withProductDiscounts } from '@/lib/discounts';
import { cookies } from 'next/headers';

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category || null;

  if (category && category !== 'ALL') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    const title = `${formattedCat} Menu - Long Island Cannabis Delivery | HolyBuds`;
    const description = `Browse our curated selection of ${formattedCat.toLowerCase()} available for fast same-day weed delivery across Long Island (Nassau & Suffolk Counties) or pickup at HolyBuds Dispensary.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/menu?category=${encodeURIComponent(category)}`,
      },
      openGraph: {
        title,
        description,
        url: `/menu?category=${encodeURIComponent(category)}`,
        siteName: 'HolyBuds Dispensary',
      },
    };
  }

  return {
    title: 'Dispensary Menu & Online Ordering | Long Island Delivery | HolyBuds',
    description: 'Explore top-shelf cannabis flower, edibles, vapes, prerolls, and concentrates with same-day delivery across Long Island (Nassau & Suffolk) or pickup at HolyBuds.',
    alternates: {
      canonical: '/menu',
    },
    openGraph: {
      title: 'Dispensary Menu & Online Ordering | Long Island Delivery | HolyBuds',
      description: 'Explore top-shelf cannabis flower, edibles, vapes, prerolls, and concentrates with same-day delivery across Long Island (Nassau & Suffolk) or pickup at HolyBuds.',
      url: '/menu',
      siteName: 'HolyBuds Dispensary',
    },
  };
}

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
      where.OR = [
        { category: category },
        { categories: { contains: `"${category}"` } }
      ];
    }
  } else {
    // Exclude wholesale from ALL categories if they don't have access
    if (!hasWholesaleAccess) {
      where.AND = [
        { category: { not: 'wholesale' } },
        { NOT: { categories: { contains: '"wholesale"' } } }
      ];
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
