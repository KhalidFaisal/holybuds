import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { referralCode: code.toUpperCase() }
    });

    if (!driver || !driver.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 404 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
      select: { customerReferralDiscount: true }
    });

    const discountAmount = settings?.customerReferralDiscount ?? 5.0;

    return NextResponse.json({ 
      driverName: driver.name,
      discountAmount 
    });
  } catch (error) {
    console.error('Error fetching referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
