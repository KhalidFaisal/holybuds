import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, image: true, category: true }
                }
              }
            }
          }
        },
        referralsMade: {
          orderBy: { createdAt: 'desc' },
          include: {
            referee: {
              select: { id: true, name: true, phone: true }
            },
            order: {
              select: { id: true, orderNumber: true, total: true }
            }
          }
        },
        referralsReceived: {
          include: {
            referrer: {
              select: { id: true, name: true, phone: true, referralCode: true }
            }
          }
        },
        driverReferrals: {
          include: {
            driver: {
              select: { id: true, name: true, referralCode: true }
            }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Build unified chronological timeline
    const timeline = [];

    // 1. Orders
    let lifetimeSpend = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    customer.orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        lifetimeSpend += order.total;
        completedOrdersCount++;
      } else {
        cancelledOrdersCount++;
      }

      timeline.push({
        type: 'ORDER',
        id: order.id,
        date: order.createdAt,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        discountAmount: order.discountAmount,
        discountName: order.discountName,
        pointsEarned: order.pointsEarned,
        pointsUsed: order.pointsUsed,
        creditUsed: order.creditUsed,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        items: order.items.map(item => ({
          id: item.id,
          name: item.product?.name || 'Unknown Product',
          category: item.product?.category,
          quantity: item.quantity,
          price: item.price
        }))
      });
    });

    // 2. Customer Referrals Made (When friends purchased using this customer's code)
    customer.referralsMade.forEach(ref => {
      timeline.push({
        type: 'REFERRAL_REWARD',
        id: ref.id,
        date: ref.createdAt,
        rewardCredit: ref.rewardCredit,
        rewardPoints: ref.rewardPoints,
        refereeName: ref.referee?.name || 'New Customer',
        refereePhone: ref.referee?.phone,
        orderNumber: ref.order?.orderNumber
      });
    });

    // 3. Signup Event
    timeline.push({
      type: 'SIGNUP',
      id: `signup-${customer.id}`,
      date: customer.createdAt,
      details: 'Customer profile created'
    });

    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Behavioral flags
    const flags = [];
    if (lifetimeSpend >= 1000) flags.push('⭐ VIP');
    if (completedOrdersCount >= 5) flags.push('🔥 Frequent Buyer');
    if (cancelledOrdersCount >= 2) flags.push('⚠️ Multiple Cancellations');
    if (customer.referralsMade.length >= 3) flags.push('🤝 Top Referrer');

    // Site timezone
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const timezone = settings?.timezone || 'UTC';

    const customerSummary = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.user?.email || null,
      address: customer.address,
      points: customer.points,
      storeCredit: customer.storeCredit,
      totalOrders: customer.totalOrders,
      referralCode: customer.referralCode,
      referredByCode: customer.referredByCode,
      createdAt: customer.createdAt
    };

    const stats = {
      lifetimeSpend,
      completedOrdersCount,
      cancelledOrdersCount,
      totalReferrals: customer.referralsMade.length,
      flags
    };

    return NextResponse.json({
      customer: customerSummary,
      timeline,
      stats,
      timezone
    });
  } catch (error) {
    console.error('Error fetching customer history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
