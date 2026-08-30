import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boxes = await prisma.inventoryBox.findMany({
      include: {
        driver: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ boxes });
  } catch (error) {
    console.error('Error fetching inventory boxes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { action, boxId, driverId, itemsToAdd } = data;

    if (action === 'CREATE') {
      const { name } = data;
      const box = await prisma.inventoryBox.create({ data: { name } });
      return NextResponse.json({ success: true, box });
    }

    if (action === 'ASSIGN') {
      const targetDriverId = driverId || null;
      
      // Unassign driver from any other box first
      if (targetDriverId) {
        await prisma.inventoryBox.updateMany({
          where: { currentDriverId: targetDriverId },
          data: { currentDriverId: null }
        });
      }

      const box = await prisma.inventoryBox.update({
        where: { id: boxId },
        data: { currentDriverId: targetDriverId }
      });
      return NextResponse.json({ success: true, box });
    }

    if (action === 'RESTOCK') {
      // itemsToAdd = { [productId]: quantityToAdd }
      await prisma.$transaction(async (tx) => {
        for (const [productId, quantity] of Object.entries(itemsToAdd)) {
          if (quantity > 0) {
            await tx.boxItem.upsert({
              where: {
                boxId_productId: { boxId, productId }
              },
              update: { expectedQuantity: { increment: Number(quantity) } },
              create: {
                boxId,
                productId,
                expectedQuantity: Number(quantity)
              }
            });
          }
        }

        await tx.boxLog.create({
          data: {
            boxId,
            type: 'RESTOCK',
            details: JSON.stringify(itemsToAdd)
          }
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating inventory boxes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
