import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

function generateOrderNumber() {
  const prefix = 'ELV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (status && status !== 'ALL') where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.customerName || !data.customerPhone || !data.items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deliveryMethod = data.deliveryMethod === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
    if (deliveryMethod === 'DELIVERY' && !data.deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address is required for delivery orders' }, { status: 400 });
    }

    // Validate stock and calculate subtotal
    let subtotal = 0;
    const itemsData = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }
      subtotal += product.price * item.quantity;
      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        category: product.category,
      });
    }

    // Evaluate Discounts
    const activeDiscounts = await prisma.discount.findMany({
      where: { isActive: true },
    });

    let bestDiscountAmount = 0;
    let bestDiscountName = null;

    for (const discount of activeDiscounts) {
      let qualifyingTotal = 0;

      let targetIds = [];
      if (discount.targetType === 'SPECIFIC_PRODUCTS' && discount.targetProductIds) {
        try {
          targetIds = JSON.parse(discount.targetProductIds);
        } catch (e) {
          console.error('Invalid targetProductIds JSON for discount', discount.id);
        }
      }

      for (const item of itemsData) {
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
        
        if (amount > qualifyingTotal) amount = qualifyingTotal; // Cap fixed discounts

        if (amount > bestDiscountAmount) {
          bestDiscountAmount = amount;
          bestDiscountName = discount.name;
        }
      }
    }

    const total = subtotal - bestDiscountAmount;

    if (deliveryMethod === 'DELIVERY' && total < 100) {
      return NextResponse.json({ error: 'Delivery orders must be at least $100 after discounts' }, { status: 400 });
    }

    // Create order and decrement stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryMethod,
          deliveryAddress: data.deliveryAddress || '',
          total,
          discountName: bestDiscountName,
          discountAmount: bestDiscountAmount,
          notes: data.notes || '',
          items: {
            create: itemsData.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Decrement stock
      for (const item of itemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    // Send WhatsApp Webhook
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      try {
        let itemsList = order.items.map(i => `${i.quantity}x ${i.product.name} ($${i.price})`).join('\n');
        
        let message = `🌿 *New Order Received!*\n\n` +
                      `*Customer:* ${order.customerName}\n` +
                      `*Method:* ${order.deliveryMethod}\n`;
        
        if (order.deliveryMethod === 'DELIVERY') {
          message += `*Address:* ${order.deliveryAddress}\n`;
        }
        
        if (order.notes) {
          message += `*Notes:* ${order.notes}\n`;
        }
        
        message += `\n*Items:*\n${itemsList}\n\n`;
        
        if (order.discountAmount > 0) {
          message += `*Discount:* -$${order.discountAmount.toFixed(2)} (${order.discountName})\n`;
        }
        message += `*Total:* $${order.total.toFixed(2)}`;

        // Send POST request
        await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WHATSAPP_WEBHOOK_SECRET || ''}`,
            'x-webhook-secret': process.env.WHATSAPP_WEBHOOK_SECRET || ''
          },
          body: JSON.stringify({ 
            message,
            secret: process.env.WHATSAPP_WEBHOOK_SECRET || ''
          })
        }).catch(err => console.error('Failed to send WhatsApp webhook:', err));
        
      } catch (webhookErr) {
        console.error('Webhook error:', webhookErr);
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
