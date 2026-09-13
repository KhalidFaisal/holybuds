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

    let orders = [];
    if (user.customer) {
      const phoneMatches = [user.customer.phone];
      const cleanPhone = user.customer.phone ? user.customer.phone.replace(/\D/g, '') : '';
      if (cleanPhone && !phoneMatches.includes(cleanPhone)) {
        phoneMatches.push(cleanPhone);
      }

      orders = await prisma.order.findMany({
        where: {
          OR: [
            { customerId: user.customer.id },
            { customerPhone: { in: phoneMatches } }
          ],
          NOT: {
            status: { in: ['DELETED', 'deleted'] }
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: true }
          }
        }
      });
    }

    let tierPoints = user.customer?.points || 0;
    let totalPointsUsed = 0;
    if (orders.length > 0) {
      totalPointsUsed = orders.reduce((sum, o) => sum + (o.pointsUsed || 0), 0);
      tierPoints = (user.customer?.points || 0) + totalPointsUsed;
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
        totalOrders: Math.max(user.customer.totalOrders || 0, orders.length),
        referralCode: user.customer.referralCode,
        createdAt: user.customer.createdAt,
        referralsMade: user.customer.referralsMade || [],
      } : null,
      orders,
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
