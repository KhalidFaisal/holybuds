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
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          items: {
            include: { product: true }
          }
        }
      });
      if (!order || order.status !== 'PENDING') {
        return NextResponse.json({ error: 'Order is no longer available' }, { status: 400 });
      }
      
      let box = driver.currentBox;
      if (!box) {
        box = await prisma.inventoryBox.findFirst({
          where: { currentDriverId: driver.id }
        });
      }

      if (!box) {
        return NextResponse.json({ error: 'You must have an assigned box to claim orders' }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const deductions = [];

        // Deduct items from driver's box upon CLAIM using upsert (so missing boxItem rows are never silently skipped)
        for (const item of order.items) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;

          await tx.boxItem.upsert({
            where: {
              boxId_productId: {
                boxId: box.id,
                productId: item.productId
              }
            },
            update: {
              expectedQuantity: { decrement: qty }
            },
            create: {
              boxId: box.id,
              productId: item.productId,
              expectedQuantity: -qty
            }
          });

          deductions.push({
            productId: item.productId,
            name: item.product?.name || 'Product',
            quantity: qty
          });
        }

        // Record BoxLog so deductions are tracked in box history
        await tx.boxLog.create({
          data: {
            boxId: box.id,
            type: 'ORDER_CLAIM',
            details: JSON.stringify({
              note: `Driver ${driver.name} claimed Order #${order.orderNumber}`,
              orderNumber: order.orderNumber,
              driverName: driver.name,
              deductions
            })
          }
        });

        return await tx.order.update({
          where: { id: orderId },
          data: {
            driverId: driver.id,
            boxId: box.id,
            status: 'PROCESSING'
          }
        });
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (action === 'DELIVER') {
      const { updatedItems, newTotal, paidCash, paidZelle, amountOwed } = data;

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

      let boxId = order.boxId;
      if (!boxId) {
        const box = driver.currentBox || await prisma.inventoryBox.findFirst({
          where: { currentDriverId: driver.id }
        });
        boxId = box?.id;
      }

      if (!boxId) {
        return NextResponse.json({ error: 'Order is not associated with a box' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        let finalItems = order.items;
        let finalTotal = order.total;

        // 1. Swap items if requested
        if (updatedItems && Array.isArray(updatedItems)) {
          finalTotal = newTotal !== undefined ? Number(newTotal) : order.total;
          
          // Calculate delta for box inventory adjustments
          // Because items were already deducted on CLAIM:
          // Any increase in item quantity needs to be decremented from the box.
          // Any decrease/removal of item quantity needs to be incremented back into the box.
          const itemDeltas = {};
          for (const orig of order.items) {
            itemDeltas[orig.productId] = (itemDeltas[orig.productId] || 0) - orig.quantity;
          }
          for (const updated of updatedItems) {
            itemDeltas[updated.productId] = (itemDeltas[updated.productId] || 0) + Number(updated.quantity);
          }

          for (const [productId, delta] of Object.entries(itemDeltas)) {
            if (delta === 0) continue;
            await tx.boxItem.upsert({
              where: {
                boxId_productId: {
                  boxId,
                  productId
                }
              },
              update: {
                expectedQuantity: { decrement: delta }
              },
              create: {
                boxId,
                productId,
                expectedQuantity: -delta
              }
            });
          }

          await tx.order.update({
            where: { id: orderId },
            data: {
              items: {
                deleteMany: {},
                create: updatedItems.map(i => ({
                  productId: i.productId,
                  quantity: Number(i.quantity),
                  price: Number(i.price)
                }))
              }
            }
          });
          finalItems = updatedItems;

          const originalStr = order.items.map(i => `${i.quantity}x ${i.product?.name || 'Unknown'}`).join(', ');
          const swappedStr = updatedItems.map(i => `${i.quantity}x ${i.name || 'Unknown'}`).join(', ');

          await tx.boxLog.create({
            data: {
              boxId,
              type: 'ORDER_SWAP',
              details: JSON.stringify({
                note: `Driver ${driver.name} swapped items for Order ${order.orderNumber}.`,
                driverName: driver.name,
                orderNumber: order.orderNumber,
                original: originalStr,
                swapped: swappedStr
              })
            }
          });
        }

        // 2. Note: Box items were already deducted when CLAIMED.
        // We do NOT deduct them again upon delivery.

        // 3. Update order status and payment fields
        await tx.order.update({
          where: { id: orderId },
          data: { 
            status: 'DELIVERED',
            total: finalTotal,
            paidCash: Number(paidCash || 0),
            paidZelle: Number(paidZelle || 0),
            amountOwed: Number(amountOwed || 0)
          }
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
