import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: { provider: true }
        },
        customer: {
          include: {
            orders: {
              take: 25,
              orderBy: { createdAt: 'desc' },
              include: {
                items: {
                  include: { product: true }
                }
              }
            },
            referralsMade: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                rewardCredit: true,
                rewardPoints: true,
                createdAt: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
    });

    let tierPoints = user.customer?.points || 0;
    let totalPointsUsed = 0;
    if (user.customer?.orders) {
      totalPointsUsed = user.customer.orders.reduce((sum, o) => sum + (o.pointsUsed || 0), 0);
      tierPoints = (user.customer.points || 0) + totalPointsUsed;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        hasPassword: Boolean(user.passwordHash),
        authProviders: (user.accounts || []).map(a => a.provider),
      },
      customer: user.customer ? {
        id: user.customer.id,
        phone: user.customer.phone,
        phoneVerified: user.customer.phoneVerified,
        name: user.customer.name,
        address: user.customer.address,
        birthdate: user.customer.birthdate,
        points: user.customer.points,
        tierPoints,
        totalPointsUsed,
        storeCredit: user.customer.storeCredit,
        totalOrders: user.customer.totalOrders,
        referralCode: user.customer.referralCode,
        createdAt: user.customer.createdAt,
        referralsMade: user.customer.referralsMade || [],
      } : null,
      orders: user.customer?.orders || [],
      settings: settings ? {
        pointsPerDollar: settings.pointsPerDollar,
        customerReferralDiscount: settings.customerReferralDiscount,
        promoCustomerReferralCredit: settings.promoCustomerReferralCredit,
        promoCustomerReferralDiscount: settings.promoCustomerReferralDiscount,
        referralPromoEndDate: settings.referralPromoEndDate,
      } : null,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
