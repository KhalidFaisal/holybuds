import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;
  if (!id) {
    return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' },
          include: { customer: true, order: true }
        },
        bonuses: {
          orderBy: { createdAt: 'desc' }
        },
        payouts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Unify and sort the timeline
    const timeline = [];

    driver.referrals.forEach(ref => {
      timeline.push({
        type: 'REFERRAL',
        id: ref.id,
        amount: ref.rewardAmount,
        date: ref.createdAt,
        orderId: ref.orderId,
        orderNumber: ref.order?.orderNumber,
        customerId: ref.customerId,
        customerName: ref.customer?.name || ref.order?.customerName || 'Unknown'
      });
    });

    driver.bonuses.forEach(bonus => {
      timeline.push({
        type: 'BONUS',
        id: bonus.id,
        amount: bonus.bonusAmount,
        date: bonus.createdAt,
        referralCount: bonus.referralCount
      });
    });

    driver.payouts.forEach(payout => {
      timeline.push({
        type: 'PAYOUT',
        id: payout.id,
        amount: payout.amount,
        date: payout.createdAt
      });
    });

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Fetch site timezone
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const timezone = settings?.timezone || 'UTC';

    return NextResponse.json({ timeline, timezone });
  } catch (error) {
    console.error('Error fetching driver history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
