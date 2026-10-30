import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerRetentionStatus, WINBACK_DISCOUNT_PERCENT, WINBACK_DISCOUNT_NAME, WINBACK_PROMO_CODE } from '@/lib/retention';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const pointsPerDollar = settings?.pointsPerDollar ?? 1;
    const rewardsMaintenanceMode = settings?.rewardsMaintenanceMode ?? true;

    if (!phone) {
      return NextResponse.json({
        success: true,
        settings: {
          pointsPerDollar,
          rewardsMaintenanceMode
        }
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: phone }
    });

    if (!customer) {
      return NextResponse.json({
        success: true,
        isNewCustomer: true,
        customer: null,
        settings: {
          pointsPerDollar,
          rewardsMaintenanceMode
        }
      });
    }

    let referralCode = customer.referralCode;
    if (!referralCode) {
      // Generate a short, friendly referral code
      referralCode = 'HOLY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { referralCode }
      });
    }

    // Check latest order for win-back 10% eligibility
    const latestOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { customerId: customer.id },
          { customerPhone: phone }
        ],
        status: { not: 'CANCELLED' }
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const retention = getCustomerRetentionStatus(latestOrder?.createdAt, customer.totalOrders);

    return NextResponse.json({
      success: true,
      isNewCustomer: false,
      customer: {
        name: customer.name,
        points: customer.points,
        totalOrders: customer.totalOrders,
        referralCode: referralCode,
        address: customer.address
      },
      winBack: {
        eligible: retention.isWinBackEligible,
        discountPercent: WINBACK_DISCOUNT_PERCENT,
        discountName: WINBACK_DISCOUNT_NAME,
        promoCode: WINBACK_PROMO_CODE,
        daysSinceLastOrder: retention.daysSinceLastOrder
      },
      settings: {
        pointsPerDollar,
        rewardsMaintenanceMode
      }
    });
  } catch (error) {
    console.error('Loyalty lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
