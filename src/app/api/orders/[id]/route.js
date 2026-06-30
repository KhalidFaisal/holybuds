import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const order = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      if (data.items) {
        // Edit order items
        const productDiff = {};
        for (const item of currentOrder.items) {
          productDiff[item.productId] = (productDiff[item.productId] || 0) - item.quantity;
        }
        for (const item of data.items) {
          productDiff[item.productId] = (productDiff[item.productId] || 0) + item.quantity;
        }

        // Apply stock changes
        if (currentOrder.status !== 'CANCELLED') {
          for (const [productId, diff] of Object.entries(productDiff)) {
            if (diff === 0) continue;
            
            if (diff > 0) {
              const prod = await tx.product.findUnique({ where: { id: productId } });
              if (!prod || prod.stock < diff) {
                 throw new Error(`Insufficient stock for product ${prod?.name || productId}`);
              }
            }
            
            await tx.product.update({
              where: { id: productId },
              data: { stock: { decrement: diff } }
            });
          }
        }

        await tx.orderItem.deleteMany({ where: { orderId: id } });

        let newSubtotal = 0;
        const newItemsData = [];
        const itemsWithCategory = [];
        
        for (const item of data.items) {
           const prod = await tx.product.findUnique({ where: { id: item.productId } });
           if (!prod) throw new Error(`Product not found: ${item.productId}`);
           newSubtotal += prod.price * item.quantity;
           newItemsData.push({
             productId: item.productId,
             quantity: item.quantity,
             price: prod.price
           });
           itemsWithCategory.push({
             productId: prod.id,
             quantity: item.quantity,
             price: prod.price,
             category: prod.category
           });
        }

        // Re-evaluate discount
        const activeDiscounts = await tx.discount.findMany({ where: { isActive: true } });
        let bestDiscountAmount = 0;
        let bestDiscountName = null;

        for (const discount of activeDiscounts) {
          let qualifyingTotal = 0;
          let targetIds = [];
          if (discount.targetType === 'SPECIFIC_PRODUCTS' && discount.targetProductIds) {
            try { targetIds = JSON.parse(discount.targetProductIds); } catch (e) {}
          }

          for (const item of itemsWithCategory) {
            const lineTotal = item.price * item.quantity;
            if (discount.targetType === 'ENTIRE_ORDER') {
              qualifyingTotal += lineTotal;
            } else if (discount.targetType === 'CATEGORY' && item.category === discount.targetCategory) {
              qualifyingTotal += lineTotal;
            } else if (discount.targetType === 'SPECIFIC_PRODUCTS' && targetIds.includes(item.productId)) {
              qualifyingTotal += lineTotal;
            }
          }

          if (qualifyingTotal >= discount.minOrderValue && qualifyingTotal > 0) {
            let amount = discount.type === 'PERCENTAGE' 
              ? qualifyingTotal * (discount.value / 100) 
              : discount.value;
            
            if (amount > qualifyingTotal) amount = qualifyingTotal;

            if (amount > bestDiscountAmount) {
              bestDiscountAmount = amount;
              bestDiscountName = discount.name;
            }
          }
        }

        let newTotal = newSubtotal - bestDiscountAmount;
        let deliveryFee = 0;
        if (currentOrder.deliveryMethod === 'DELIVERY' && newTotal < 100) {
           deliveryFee = 10;
           newTotal += deliveryFee;
        }

        await tx.order.update({
          where: { id },
          data: {
             total: newTotal,
             discountName: bestDiscountName,
             discountAmount: bestDiscountAmount,
             items: {
               create: newItemsData
             }
          }
        });
      } else if (data.status) {
        // Status updates
        if (data.status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
          // Cancelled: restore inventory
          for (const item of currentOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        } else if (data.status !== 'CANCELLED' && currentOrder.status === 'CANCELLED') {
          // Un-cancelled: reserve inventory again
          for (const item of currentOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      const updateData = {};
      if (data.status) updateData.status = data.status;

      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          items: { include: { product: true } },
        },
      });

      // TRIGGER GOOGLE SHEETS WEBHOOK ON COMPLETION
      if (data.status === 'COMPLETED' && currentOrder.status !== 'COMPLETED') {
        const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            const itemsSubtotal = updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const rawDeliveryFee = updatedOrder.total + updatedOrder.discountAmount - itemsSubtotal;
            const deliveryFee = rawDeliveryFee > 0 ? Math.round(rawDeliveryFee * 100) / 100 : 0;
            // Reconstruct discount per item
            let discount = null;
            if (updatedOrder.discountName) {
              discount = await tx.discount.findFirst({ where: { name: updatedOrder.discountName } });
            }
            
            let qualifyingTotal = 0;
            let targetIds = [];
            if (discount && discount.targetType === 'SPECIFIC_PRODUCTS' && discount.targetProductIds) {
              try { targetIds = JSON.parse(discount.targetProductIds); } catch(e){}
            }

            const itemEligibility = updatedOrder.items.map(item => {
              let eligible = false;
              if (discount) {
                if (discount.targetType === 'ENTIRE_ORDER') eligible = true;
                else if (discount.targetType === 'CATEGORY' && item.product.category === discount.targetCategory) eligible = true;
                else if (discount.targetType === 'SPECIFIC_PRODUCTS' && targetIds.includes(item.productId)) eligible = true;
              }
              const lineTotal = item.price * item.quantity;
              if (eligible) qualifyingTotal += lineTotal;
              return { ...item, eligible, lineTotal };
            });

            const rows = itemEligibility.map(item => {
              let itemDiscount = 0;
              if (item.eligible && qualifyingTotal > 0 && updatedOrder.discountAmount > 0) {
                const proportion = item.lineTotal / qualifyingTotal;
                itemDiscount = proportion * updatedOrder.discountAmount;
              }
              const finalLineTotal = item.lineTotal - itemDiscount;
              const finalUnitPrice = finalLineTotal / item.quantity;

              const rowData = Array(11).fill(""); // A through K (0 to 10)
              rowData[2] = item.product.name; // C column
              rowData[3] = item.quantity; // D column
              rowData[4] = Math.round(finalLineTotal * 100) / 100; // E column (discounted line total)
              rowData[6] = updatedOrder.customerName; // G column
              rowData[10] = deliveryFee > 0 ? deliveryFee : ""; // K column
              return rowData;
            });

            // Await the webhook to prevent race conditions in Google Sheets during bulk updates
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rows)
            }).catch(err => console.error("Webhook error:", err));

          } catch (webhookErr) {
            console.error('Failed to construct webhook payload:', webhookErr);
          }
        }
      }

      return updatedOrder;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Restore inventory if active order is deleted
      if (currentOrder.status !== 'CANCELLED') {
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });

      await tx.order.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
