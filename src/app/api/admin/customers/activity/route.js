import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent events in parallel
    const [recentOrders, recentReferrals, recentCustomers, settings] = await Promise.all([
      prisma.order.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          },
          items: {
            include: {
              product: { select: { name: true } }
            }
          }
        }
      }),
      prisma.customerReferral.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { id: true, name: true, phone: true } },
          referee: { select: { id: true, name: true, phone: true } },
          order: { select: { orderNumber: true, total: true } }
        }
      }),
      prisma.customer.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } }
        }
      }),
      prisma.siteSettings.findUnique({ where: { id: 'global' } })
    ]);

    const events = [];

    // Orders
    recentOrders.forEach(o => {
      events.push({
        id: `order-${o.id}`,
        type: 'ORDER',
        date: o.createdAt,
        customerId: o.customerId,
        customerName: o.customer?.name || o.customerName,
        customerPhone: o.customerPhone,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        pointsEarned: o.pointsEarned,
        pointsUsed: o.pointsUsed,
        creditUsed: o.creditUsed,
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0)
      });
    });

    // Customer Referrals
    recentReferrals.forEach(r => {
      events.push({
        id: `referral-${r.id}`,
        type: 'REFERRAL_REWARD',
        date: r.createdAt,
        referrerId: r.referrerId,
        referrerName: r.referrer?.name || 'Referrer',
        refereeId: r.refereeId,
        refereeName: r.referee?.name || 'Friend',
        rewardCredit: r.rewardCredit,
        rewardPoints: r.rewardPoints,
        orderNumber: r.order?.orderNumber
      });
    });

    // New Customers
    recentCustomers.forEach(c => {
      events.push({
        id: `customer-${c.id}`,
        type: 'SIGNUP',
        date: c.createdAt,
        customerId: c.id,
        customerName: c.name,
        customerPhone: c.phone,
        customerEmail: c.user?.email || null,
        referralCode: c.referralCode,
        referredByCode: c.referredByCode
      });
    });

    // Sort descending by date
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    const timezone = settings?.timezone || 'UTC';

    return NextResponse.json({
      events: events.slice(0, 50),
      timezone
    });
  } catch (error) {
    console.error('Error fetching customer activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
