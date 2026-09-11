import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { syncCompletedOrdersToGoogleSheets } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

async function handleBulkStatus(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds, status } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds must be a non-empty array' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Run database updates inside a clean transaction
    const { updatedOrders, newlyCompletedOrders } = await prisma.$transaction(async (tx) => {
      const currentOrders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      const newlyCompleted = [];

      for (const order of currentOrders) {
        if (status === order.status) continue;

        if (status === 'COMPLETED') {
          if (order.status !== 'COMPLETED') {
            newlyCompleted.push(order);

            // Handle referral payout
            if (order.customer?.referredByCode && !order.customer.referralPaidOut) {
              const referrer = await tx.customer.findUnique({
                where: { referralCode: order.customer.referredByCode },
              });

              if (referrer) {
                await tx.customer.update({
                  where: { id: referrer.id },
                  data: { points: { increment: 100 } },
                });
                await tx.customer.update({
                  where: { id: order.customer.id },
                  data: { referralPaidOut: true },
                });
              }
            }

            await tx.order.update({
              where: { id: order.id },
              data: { status: 'COMPLETED' },
            });
          }
        } else if (status === 'PENDING') {
          // If claimed and in PROCESSING/READY, restore items to driver's box
          if (order.boxId && ['PROCESSING', 'READY'].includes(order.status)) {
            const restored = [];
            for (const item of order.items) {
              const qty = Number(item.quantity) || 0;
              if (qty <= 0) continue;

              await tx.boxItem.upsert({
                where: {
                  boxId_productId: {
                    boxId: order.boxId,
                    productId: item.productId,
                  },
                },
                update: {
                  expectedQuantity: { increment: qty },
                },
                create: {
                  boxId: order.boxId,
                  productId: item.productId,
                  expectedQuantity: qty,
                },
              });

              restored.push({
                productId: item.productId,
                name: item.product?.name || 'Product',
                quantity: qty,
              });
            }

            await tx.boxLog.create({
              data: {
                boxId: order.boxId,
                type: 'ORDER_UNCLAIM',
                details: JSON.stringify({
                  note: `Order #${order.orderNumber} reset to PENDING via bulk update. Items returned to box.`,
                  orderNumber: order.orderNumber,
                  restored,
                }),
              },
            });
          }

          // Unassign driver and box so order returns to available pool
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'PENDING',
              driverId: null,
              boxId: null,
            },
          });
        } else if (status === 'CANCELLED') {
          // Restore warehouse stock
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }

          // If in box, restore box inventory as well
          if (order.boxId && ['PROCESSING', 'READY'].includes(order.status)) {
            for (const item of order.items) {
              const boxItem = await tx.boxItem.findUnique({
                where: {
                  boxId_productId: {
                    boxId: order.boxId,
                    productId: item.productId,
                  },
                },
              });
              if (boxItem) {
                await tx.boxItem.update({
                  where: { id: boxItem.id },
                  data: { expectedQuantity: { increment: Number(item.quantity) } },
                });
              }
            }
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });
        } else {
          // If un-cancelling, reserve warehouse stock
          if (order.status === 'CANCELLED') {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status },
          });
        }
      }

      const allUpdated = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      return { updatedOrders: allUpdated, newlyCompletedOrders: newlyCompleted };
    });

    // OUTSIDE DB TRANSACTION:
    // Sync all newly completed orders to Google Sheets in ONE single batch call
    if (status === 'COMPLETED' && newlyCompletedOrders.length > 0) {
      const newlyCompletedMap = new Set(newlyCompletedOrders.map(o => o.id));
      const ordersToSync = updatedOrders.filter(o => newlyCompletedMap.has(o.id));
      await syncCompletedOrdersToGoogleSheets(ordersToSync);
    }

    return NextResponse.json({
      success: true,
      updatedOrders,
      count: updatedOrders.length,
    });
  } catch (error) {
    console.error('Error in bulk order update:', error);
    return NextResponse.json({ error: 'Failed to update orders in bulk' }, { status: 500 });
  }
}

export async function POST(request) {
  return handleBulkStatus(request);
}

export async function PATCH(request) {
  return handleBulkStatus(request);
}
