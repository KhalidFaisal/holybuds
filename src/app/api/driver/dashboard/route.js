import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    const { phone, pin } = data;

    if (!phone || !pin) {
      return NextResponse.json({ error: 'Phone/Email and PIN required' }, { status: 400 });
    }

    const driver = await prisma.driver.findFirst({
      where: {
        OR: [
          { phone },
          { email: phone }
        ],
        pin,
        isActive: true
      },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!driver || driver.pin !== pin) {
      return NextResponse.json({ error: 'Invalid phone or PIN' }, { status: 401 });
    }

    if (!driver.isActive) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    // Get stats
    const totalReferrals = await prisma.driverReferral.count({
      where: { driverId: driver.id }
    });

    const totalBonuses = await prisma.driverBonus.count({
      where: { driverId: driver.id }
    });

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
      select: { driverBonusThreshold: true, driverBonusAmount: true }
    });
    
    const threshold = settings?.driverBonusThreshold || 10;
    const bonusAmount = settings?.driverBonusAmount || 100.0;
    const progressToBonus = totalReferrals % threshold;

    // Get Box Info
    const currentBox = await prisma.inventoryBox.findUnique({
      where: { currentDriverId: driver.id },
      include: {
        items: { include: { product: true } }
      }
    });

    const pendingHandoffs = await prisma.handoff.findMany({
      where: { toDriverId: driver.id, status: 'PENDING' },
      include: { fromDriver: true, box: true }
    });

    return NextResponse.json({
      id: driver.id,
      name: driver.name,
      referralCode: driver.referralCode,
      totalEarned: driver.totalEarned,
      pendingPayout: driver.pendingPayout,
      totalReferrals,
      totalBonuses,
      progressToBonus,
      bonusThreshold: threshold,
      bonusAmount: bonusAmount,
      currentBox,
      pendingHandoffs,
      recentReferrals: driver.referrals.map(r => ({
        id: r.id,
        date: r.createdAt,
        rewardAmount: r.rewardAmount
      }))
    });
  } catch (error) {
    console.error('Driver auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
