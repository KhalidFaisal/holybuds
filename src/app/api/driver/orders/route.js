import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    // We expect the token to just be the driver ID for this simple auth
    const driver = await prisma.driver.findUnique({
      where: { id: token },
      include: { currentBox: true }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'AVAILABLE'; // AVAILABLE, MY_ORDERS

    let orders;

    if (filter === 'AVAILABLE') {
      orders = await prisma.order.findMany({
        where: { status: 'PENDING' },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      orders = await prisma.order.findMany({
        where: { 
          driverId: driver.id,
          status: { in: ['PROCESSING', 'READY'] } 
        },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    const safeOrders = orders.map(order => {
      const { customerPhone, ...safeOrder } = order;
      return safeOrder;
    });

    return NextResponse.json(safeOrders);
  } catch (error) {
    console.error('Error fetching driver orders:', error);
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
      include: { currentBox: true }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const data = await request.json();
    const { action, orderId } = data;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (action === 'CLAIM') {
      // Check if order is still PENDING
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'PENDING') {
        return NextResponse.json({ error: 'Order is no longer available' }, { status: 400 });
      }
      
      if (!driver.currentBox) {
        return NextResponse.json({ error: 'You must have an assigned box to claim orders' }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: driver.id,
          boxId: driver.currentBox.id,
          status: 'PROCESSING'
        }
      });
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === 'DELIVER') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      
      if (!order || order.driverId !== driver.id) {
        return NextResponse.json({ error: 'Unauthorized to deliver this order' }, { status: 403 });
      }

      if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Order already delivered or completed' }, { status: 400 });
      }

      if (!order.boxId) {
        return NextResponse.json({ error: 'Order is not associated with a box' }, { status: 400 });
      }

      // Deduct items from Box
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const boxItem = await tx.boxItem.findUnique({
            where: {
              boxId_productId: {
                boxId: order.boxId,
                productId: item.productId
              }
            }
          });

          if (boxItem) {
            await tx.boxItem.update({
              where: { id: boxItem.id },
              data: { expectedQuantity: { decrement: item.quantity } }
            });
          }
        }

        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'DELIVERED' }
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating driver order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
