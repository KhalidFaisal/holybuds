import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autoTagProduct } from '@/lib/ai';
import { requireAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid or missing ids' }, { status: 400 });
    }

    // Fetch the products
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        category: 'FLOWER', // Only process flowers
      },
    });

    let updatedCount = 0;

    for (const product of products) {
      // Auto tag using the AI
      const effects = await autoTagProduct(product.name, product.category, product.description);
      
      // Update the product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          effects: JSON.stringify(effects),
        },
      });
      
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount });

  } catch (error) {
    console.error('Bulk auto-effects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
