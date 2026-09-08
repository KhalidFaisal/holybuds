import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  try {
    const upperCode = code.toUpperCase();

    // Check Driver
    const driver = await prisma.driver.findUnique({
      where: { referralCode: upperCode }
    });

    // Check Customer
    const customer = !driver ? await prisma.customer.findUnique({
      where: { referralCode: upperCode }
    }) : null;

    if (!driver && !customer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    if (driver && !driver.isActive) {
      return NextResponse.json({ error: 'Inactive referral code' }, { status: 404 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
      select: { 
        customerReferralDiscount: true,
        promoCustomerReferralDiscount: true,
        referralPromoEndDate: true,
        customerReferralMinSpend: true
      }
    });

    const isPromo = settings?.referralPromoEndDate ? new Date() < new Date(settings.referralPromoEndDate) : false;
    const minSpend = settings?.customerReferralMinSpend ?? 100.0;

    let discountAmount = settings?.customerReferralDiscount ?? 5.0;
    if (customer && isPromo) {
      discountAmount = settings?.promoCustomerReferralDiscount ?? 10.0;
    }

    if (driver) {
      return NextResponse.json({ 
        driverName: driver.name,
        discountAmount,
        minSpend: 0,
        type: 'driver'
      });
    }

    return NextResponse.json({
      referrerName: customer.name || 'Friend',
      discountAmount,
      minSpend,
      type: 'customer',
      isPromo
    });
  } catch (error) {
    console.error('Error fetching referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
