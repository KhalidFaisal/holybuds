import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: phone }
    });

    if (!customer) {
      return NextResponse.json({
        success: true,
        isNewCustomer: true,
        customer: null
      });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const pointsPerDollar = settings?.pointsPerDollar ?? 1;

    let referralCode = customer.referralCode;
    if (!referralCode) {
      // Generate a short, friendly referral code
      referralCode = 'HOLY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { referralCode }
      });
    }

    return NextResponse.json({
      success: true,
      isNewCustomer: false,
      customer: {
        name: customer.name,
        points: customer.points,
        totalOrders: customer.totalOrders,
        referralCode: referralCode
      },
      settings: {
        pointsPerDollar
      }
    });
  } catch (error) {
    console.error('Loyalty lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
