'use server';

import prisma from '@/lib/prisma';
import { withProductDiscounts } from '@/lib/discounts';

export async function getFavoriteProducts(ids) {
  if (!ids || ids.length === 0) return [];
  
  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
      isVisible: true,
      stock: { gt: 0 }
    }
  });

  const enriched = await withProductDiscounts(products);
  return JSON.parse(JSON.stringify(enriched));
}
