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
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        },
        handoffs: {
          include: {
            fromDriver: true,
            toDriver: true
          },
          orderBy: { createdAt: 'desc' }
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

      // Cancel any pending handoffs for this box since admin manually intervened
      await prisma.handoff.updateMany({
        where: { boxId, status: 'PENDING' },
        data: { status: 'CANCELLED' }
      });

      const box = await prisma.inventoryBox.update({
        where: { id: boxId },
        data: { currentDriverId: targetDriverId }
      });
      return NextResponse.json({ success: true, box });
    }

    if (action === 'RESTOCK') {
      // itemsToAdd = { [productId]: quantityToAdd }
      await prisma.$transaction(async (tx) => {
        // Fetch products to include names in the log
        const pids = Object.keys(itemsToAdd);
        const productsList = await tx.product.findMany({ where: { id: { in: pids } } });
        const pMap = {};
        productsList.forEach(p => pMap[p.id] = p.name);

        const logDetails = {};

        for (const [productId, quantity] of Object.entries(itemsToAdd)) {
          if (quantity > 0) {
            logDetails[productId] = {
              qty: Number(quantity),
              name: pMap[productId] || 'Unknown Product'
            };

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

        if (Object.keys(logDetails).length > 0) {
          await tx.boxLog.create({
            data: {
              boxId,
              type: 'RESTOCK',
              details: JSON.stringify(logDetails)
            }
          });
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'EDIT_COUNTS') {
      const { itemsToSet } = data;
      await prisma.$transaction(async (tx) => {
        const pids = Object.keys(itemsToSet);
        const productsList = await tx.product.findMany({ where: { id: { in: pids } } });
        const pMap = {};
        productsList.forEach(p => pMap[p.id] = p.name);

        const editsLog = {};

        for (const [productId, quantity] of Object.entries(itemsToSet)) {
          const newQty = Number(quantity);
          const existingItem = await tx.boxItem.findUnique({
            where: { boxId_productId: { boxId, productId } }
          });
          const oldQty = existingItem ? existingItem.expectedQuantity : 0;

          if (oldQty !== newQty) {
            editsLog[productId] = {
              name: pMap[productId] || 'Unknown Product',
              old: oldQty,
              new: newQty,
              diff: newQty - oldQty
            };
          }

          if (newQty > 0) {
            await tx.boxItem.upsert({
              where: {
                boxId_productId: { boxId, productId }
              },
              update: { expectedQuantity: newQty },
              create: {
                boxId,
                productId,
                expectedQuantity: newQty
              }
            });
          } else {
            await tx.boxItem.deleteMany({
              where: { boxId, productId }
            });
          }
        }

        if (Object.keys(editsLog).length > 0) {
          await tx.boxLog.create({
            data: {
              boxId,
              type: 'AUDIT',
              details: JSON.stringify({ note: 'Manual Admin Inventory Override', edits: editsLog })
            }
          });
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'RESET') {
      await prisma.$transaction(async (tx) => {
        await tx.boxItem.deleteMany({
          where: { boxId }
        });
        await tx.boxLog.create({
          data: {
            boxId,
            type: 'AUDIT',
            details: JSON.stringify({ note: 'Inventory reset to zero' })
          }
        });
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE') {
      // Must first delete related BoxItem, BoxLog, Handoff (or Prisma cascade handles it)
      // Prisma schema has onDelete: Cascade for BoxItem, BoxLog, Handoff. 
      // Orders might be linked via boxId. We might need to just set order boxId to null.
      await prisma.order.updateMany({
        where: { boxId },
        data: { boxId: null }
      });
      
      await prisma.inventoryBox.delete({
        where: { id: boxId }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating inventory boxes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
