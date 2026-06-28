import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withProductDiscounts } from '@/lib/discounts';

export async function GET(request) {
  try {
    // 1. Find Best Sellers to recommend as upscales
    const topOrderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    });
    
    let bestSellerIds = topOrderItems.map(i => i.productId);
    
    let products = await prisma.product.findMany({
      where: { 
        id: { in: bestSellerIds },
        isVisible: true,
        stock: { gt: 0 }
      }
    });

    // Backfill with featured products if we don't have enough best sellers
    if (products.length < 4) {
      const moreProducts = await prisma.product.findMany({
        where: {
          id: { notIn: bestSellerIds },
          isVisible: true,
          stock: { gt: 0 },
          featured: true
        },
        take: 4 - products.length
      });
      products.push(...moreProducts);
    }

    const enriched = await withProductDiscounts(products);
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching upscales:', error);
    return NextResponse.json({ error: 'Failed to fetch upscales' }, { status: 500 });
  }
}
