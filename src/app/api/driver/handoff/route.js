import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    // Check for any PENDING handoffs directed to this driver
    const pendingHandoffs = await prisma.handoff.findMany({
      where: {
        toDriverId: token,
        status: 'PENDING'
      },
      include: {
        box: true,
        fromDriver: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ handoffs: pendingHandoffs });
  } catch (error) {
    console.error('Error fetching handoffs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    const driver = await prisma.driver.findUnique({
      where: { id: token },
      include: { currentBox: { include: { items: true } } }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const data = await request.json();
    const { action } = data;

    if (action === 'CREATE') {
      const { toDriverId, actualInventory } = data;
      // actualInventory is an object { [productId]: count }

      if (!driver.currentBox) {
        return NextResponse.json({ error: 'You do not have a box to hand off' }, { status: 400 });
      }

      const boxId = driver.currentBox.id;
      
      // Compute expected inventory and discrepancies
      const expectedInventory = {};
      const discrepancies = {};
      
      for (const item of driver.currentBox.items) {
        expectedInventory[item.productId] = item.expectedQuantity;
        const actual = actualInventory[item.productId] || 0;
        if (actual !== item.expectedQuantity) {
          discrepancies[item.productId] = {
            expected: item.expectedQuantity,
            actual: actual,
            diff: actual - item.expectedQuantity
          };
        }
      }

      const handoff = await prisma.handoff.create({
        data: {
          boxId,
          fromDriverId: driver.id,
          toDriverId,
          expectedInventory: JSON.stringify(expectedInventory),
          actualInventory: JSON.stringify(actualInventory),
          discrepancies: JSON.stringify(discrepancies),
          status: 'PENDING'
        }
      });

      // Remove currentDriverId from Box to mark it as in transit/limbo
      await prisma.inventoryBox.update({
        where: { id: boxId },
        data: { currentDriverId: null }
      });

      return NextResponse.json({ success: true, handoff });
    }

    if (action === 'ACCEPT') {
      const { handoffId } = data;
      const handoff = await prisma.handoff.findUnique({
        where: { id: handoffId }
      });

      if (!handoff || handoff.toDriverId !== driver.id) {
        return NextResponse.json({ error: 'Handoff not found or unauthorized' }, { status: 403 });
      }

      if (handoff.status !== 'PENDING') {
        return NextResponse.json({ error: 'Handoff is not pending' }, { status: 400 });
      }

      // 1. Mark handoff as ACCEPTED
      // 2. Assign box to driver
      // 3. Update BoxItems to the actualInventory recorded in the handoff
      // 4. Log the audit

      await prisma.$transaction(async (tx) => {
        await tx.handoff.update({
          where: { id: handoffId },
          data: { status: 'ACCEPTED' }
        });

        await tx.inventoryBox.update({
          where: { id: handoff.boxId },
          data: { currentDriverId: driver.id }
        });

        const actual = JSON.parse(handoff.actualInventory);
        for (const [productId, quantity] of Object.entries(actual)) {
          await tx.boxItem.upsert({
            where: {
              boxId_productId: { boxId: handoff.boxId, productId }
            },
            update: { expectedQuantity: Number(quantity) },
            create: {
              boxId: handoff.boxId,
              productId,
              expectedQuantity: Number(quantity)
            }
          });
        }

        await tx.boxLog.create({
          data: {
            boxId: handoff.boxId,
            type: 'HANDOFF',
            details: JSON.stringify({
              from: handoff.fromDriverId,
              to: handoff.toDriverId,
              discrepancies: JSON.parse(handoff.discrepancies)
            })
          }
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling handoff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
