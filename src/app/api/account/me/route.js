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
        customer: {
          include: {
            orders: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                items: {
                  include: { product: true }
                }
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

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      customer: user.customer ? {
        id: user.customer.id,
        phone: user.customer.phone,
        name: user.customer.name,
        points: user.customer.points,
        referralCode: user.customer.referralCode,
      } : null,
      orders: user.customer?.orders || [],
      settings: settings ? { pointsPerDollar: settings.pointsPerDollar } : null,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
