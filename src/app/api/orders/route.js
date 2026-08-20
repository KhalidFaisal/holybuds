import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { auth } from '@/auth';
import webpush from 'web-push';

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
    const session = await auth();
    const userId = session?.user?.id || null;

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
      if (!product || !product.isVisible) {
        return NextResponse.json({ error: `Product not found or unavailable: ${item.productId}` }, { status: 400 });
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
      let qualifyingQuantity = 0;

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
          qualifyingQuantity += item.quantity;
        } else if (discount.targetType === 'CATEGORY' && item.category === discount.targetCategory) {
          qualifyingTotal += lineTotal;
          qualifyingQuantity += item.quantity;
        } else if (discount.targetType === 'SPECIFIC_PRODUCTS' && targetIds.includes(item.productId)) {
          qualifyingTotal += lineTotal;
          qualifyingQuantity += item.quantity;
        }
      }

      if (qualifyingTotal >= discount.minOrderValue && qualifyingQuantity >= (discount.minItemQuantity || 0) && qualifyingTotal > 0) {
        let amount = 0;
        if (discount.type === 'PERCENTAGE') amount = qualifyingTotal * (discount.value / 100);
        else if (discount.type === 'FIXED') amount = discount.value;
        else if (discount.type === 'BULK_FIXED') amount = discount.value * qualifyingQuantity;
        
        if (amount > qualifyingTotal) amount = qualifyingTotal; // Cap discounts

        if (amount > bestDiscountAmount) {
          bestDiscountAmount = amount;
          bestDiscountName = discount.name;
        }
      }
    }

    let notes = data.notes || '';
    const pointsUsed = data.pointsUsed || 0;
    const rewardUsed = data.rewardUsed || null;

    // Calculate Reward Discount Server Side
    let rewardDiscountAmount = 0;
    if (rewardUsed && pointsUsed > 0) {
      // Define rewards map to match frontend
      const REWARDS_MAP = {
        '500_acc': { points: 500, label: "$5 Off Any Accessory", type: "FIXED", category: "ACCESSORY", value: 5 },
        '1000_acc': { points: 1000, label: "10% Off Accessory Order", type: "PERCENT", category: "ACCESSORY", value: 10 },
        '2000_any': { points: 2000, label: "$15 Off Any Order", type: "FIXED", value: 15 },
        '3500_free': { points: 3500, label: "Free Cart or Edible", type: "FREE_LOWEST", categories: ["VAPE", "CART", "EDIBLE"] },
        '5000_any': { points: 5000, label: "$35 Off Any Order", type: "FIXED", value: 35 },
        '7500_any': { points: 7500, label: "Free Premium Accessory or $50 Off", type: "FIXED", value: 50 },
        '10000_free': { points: 10000, label: "Free 1/2", type: "FREE_LOWEST", categories: ["FLOWER"] }
      };

      // Find the reward by label
      const rewardDef = Object.values(REWARDS_MAP).find(r => r.label === rewardUsed);
      if (rewardDef && pointsUsed === rewardDef.points) {
        if (rewardDef.type === 'FIXED') {
          if (rewardDef.category) {
            const hasCat = itemsData.some(i => i.category.toUpperCase().includes(rewardDef.category));
            rewardDiscountAmount = hasCat ? rewardDef.value : 0;
          } else {
            rewardDiscountAmount = rewardDef.value;
          }
        } else if (rewardDef.type === 'PERCENT') {
          if (rewardDef.category) {
            const catTotal = itemsData.filter(i => i.category.toUpperCase().includes(rewardDef.category))
                                      .reduce((sum, i) => sum + (i.price * i.quantity), 0);
            rewardDiscountAmount = catTotal * (rewardDef.value / 100);
          } else {
            const totalItems = itemsData.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            rewardDiscountAmount = totalItems * (rewardDef.value / 100);
          }
        } else if (rewardDef.type === 'FREE_LOWEST') {
          let eligibleItems = itemsData;
          if (rewardDef.categories) {
            eligibleItems = itemsData.filter(i => rewardDef.categories.some(c => i.category.toUpperCase().includes(c)));
          }
          if (eligibleItems.length > 0) {
            const lowest = eligibleItems.reduce((min, item) => item.price < min.price ? item : min, eligibleItems[0]);
            rewardDiscountAmount = lowest.price;
          }
        }
      }
    }

    // Fetch site settings for loyalty config
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const loyaltyEnabled = settings?.loyaltyEnabled ?? true;
    const pointsPerDollar = settings?.pointsPerDollar ?? 1;
    const signupBonus = settings?.signupBonus ?? 50;
    const driverReferralReward = settings?.driverReferralReward ?? 10.0;
    const customerReferralDiscount = settings?.customerReferralDiscount ?? 5.0;
    const driverBonusThreshold = settings?.driverBonusThreshold ?? 10;
    const driverBonusAmount = settings?.driverBonusAmount ?? 100.0;

    let pointsEarned = 0;
    if (loyaltyEnabled) {
      pointsEarned = Math.floor(subtotal - bestDiscountAmount - rewardDiscountAmount) * pointsPerDollar;
      if (pointsEarned < 0) pointsEarned = 0;
    }

    const sanitizedPhone = data.customerPhone.replace(/\D/g, '');

    let effectiveTotal = subtotal - bestDiscountAmount - rewardDiscountAmount;
    if (effectiveTotal < 0) effectiveTotal = 0;
    let total = effectiveTotal;
    let deliveryFee = 0;

    if (deliveryMethod === 'DELIVERY' && total < 100) {
      deliveryFee = 10;
      total += deliveryFee;
    }

    // Create order and decrement stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = await tx.customer.findUnique({ where: { phone: sanitizedPhone } });
      
      // If logged in, grab the user to link if creating
      // userId is retrieved at the start of the request

      if (!customer) {
        const generatedReferralCode = 'HOLY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        customer = await tx.customer.create({
          data: {
            phone: sanitizedPhone,
            name: data.customerName,
            points: loyaltyEnabled ? signupBonus : 0,
            totalOrders: 0,
            referralCode: generatedReferralCode,
            referredByCode: data.referredByCode || null,
            userId: userId
          }
        });
      } else if (userId && !customer.userId) {
        // Link existing customer to the newly logged in user if they check out
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { userId }
        });
      }

      // If they don't have enough points, throw error
      if (pointsUsed > customer.points) {
        throw new Error('Insufficient points for this reward');
      }

      // Check if this is their first order and they have a valid referral code to apply discount
      let finalDiscountAmount = bestDiscountAmount;
      let finalDiscountName = bestDiscountName;

      if (data.referredByCode && customer.totalOrders === 0) {
        const validDriver = await tx.driver.findUnique({
          where: { referralCode: data.referredByCode.toUpperCase() }
        });
        if (validDriver && validDriver.isActive) {
          // It's their first order and they used a valid driver code
          // Add the driver discount
          finalDiscountAmount += customerReferralDiscount;
          if (finalDiscountName) {
            finalDiscountName += ` & Referral Discount`;
          } else {
            finalDiscountName = `Referral Discount ($${customerReferralDiscount} off)`;
          }

          // Ensure we don't discount more than the subtotal
          if (finalDiscountAmount > subtotal) {
            finalDiscountAmount = subtotal;
          }

          // Recalculate totals
          effectiveTotal = subtotal - finalDiscountAmount - rewardDiscountAmount;
          if (effectiveTotal < 0) effectiveTotal = 0;
          total = effectiveTotal + deliveryFee;

          // Recalculate points earned
          if (loyaltyEnabled) {
             pointsEarned = Math.floor(effectiveTotal) * pointsPerDollar;
             if (pointsEarned < 0) pointsEarned = 0;
          }
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerId: customer.id,
          deliveryMethod,
          deliveryAddress: data.deliveryAddress || '',
          total,
          discountName: finalDiscountName,
          discountAmount: finalDiscountAmount,
          notes,
          pointsEarned: loyaltyEnabled ? pointsEarned : 0,
          pointsUsed: pointsUsed,
          rewardUsed: rewardUsed,
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

      // Update customer points and total orders
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          points: {
            increment: (loyaltyEnabled ? pointsEarned : 0) - pointsUsed
          },
          totalOrders: {
            increment: 1
          },
          ...(data.deliveryMethod === 'DELIVERY' && data.deliveryAddress ? { address: data.deliveryAddress } : {})
        }
      });

      // Decrement stock
      for (const item of itemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Handle Driver Referral
      if (data.referredByCode && customer.totalOrders === 0) { // Local object still has pre-increment value
        const driver = await tx.driver.findUnique({
          where: { referralCode: data.referredByCode.toUpperCase() }
        });

        if (driver && driver.isActive) {
          // Add Driver Referral Record
          await tx.driverReferral.create({
            data: {
              driverId: driver.id,
              customerId: customer.id,
              orderId: newOrder.id,
              rewardAmount: driverReferralReward
            }
          });

          // Update driver earnings
          let earnedAmount = driverReferralReward;
          let bonusAmountEarned = 0;

          const totalReferrals = await tx.driverReferral.count({
            where: { driverId: driver.id }
          });

          if (totalReferrals > 0 && totalReferrals % driverBonusThreshold === 0) {
            bonusAmountEarned = driverBonusAmount;
            earnedAmount += driverBonusAmount;
            
            await tx.driverBonus.create({
              data: {
                driverId: driver.id,
                bonusAmount: driverBonusAmount,
                referralCount: totalReferrals
              }
            });
          }

          await tx.driver.update({
            where: { id: driver.id },
            data: {
              totalEarned: { increment: earnedAmount },
              pendingPayout: { increment: earnedAmount }
            }
          });
        }
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
        } else if (order.deliveryMethod === 'PICKUP' && order.deliveryAddress) {
          message += `*Town:* ${order.deliveryAddress}\n`;
        }
        
        if (order.notes) {
          message += `*Notes:* ${order.notes}\n`;
        }
        
        message += `\n*Items:*\n${itemsList}\n\n`;
        
        if (order.discountAmount > 0) {
          message += `*Discount:* -$${order.discountAmount.toFixed(2)} (${order.discountName})\n`;
        }
        if (deliveryFee > 0) {
          message += `*Delivery Fee:* $${deliveryFee.toFixed(2)}\n`;
        }
        message += `*Total:* $${order.total.toFixed(2)}`;

        // Send POST request with a 5 second timeout so it doesn't hang the order placement
        fetch(process.env.WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          signal: AbortSignal.timeout(5000),
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

    // Send Web Push Notifications
    try {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
      
      if (publicVapidKey && privateVapidKey) {
        webpush.setVapidDetails(
          'mailto:admin@holybuds.com',
          publicVapidKey,
          privateVapidKey
        );

        const subscriptions = await prisma.pushSubscription.findMany();
        
        const payload = JSON.stringify({
          title: 'New Order Received!',
          body: `Order ${order.orderNumber} for $${order.total.toFixed(2)} from ${order.customerName}`,
          url: '/admin/dashboard/orders'
        });

        const pushPromises = subscriptions.map(sub => {
          const pushSub = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          return webpush.sendNotification(pushSub, payload).catch(err => {
            console.error('Failed to send push to', sub.endpoint, err);
            // Optionally remove invalid subscriptions here
            if (err.statusCode === 410 || err.statusCode === 404) {
               return prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          });
        });

        // Don't await strictly to prevent hanging the checkout request
        Promise.all(pushPromises).catch(err => console.error('Push broadcast error:', err));
      }
    } catch (pushErr) {
      console.error('Push Notification error:', pushErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
