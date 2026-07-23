import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // See if customer exists
    let customer = await prisma.customer.findUnique({
      where: { phone: sanitizedPhone },
    });

    if (customer) {
      if (customer.userId && customer.userId !== session.user.id) {
        return NextResponse.json({ error: 'This phone number is already linked to another account' }, { status: 400 });
      }
      
      // Link existing customer to this user
      await prisma.customer.update({
        where: { id: customer.id },
        data: { userId: session.user.id }
      });
    } else {
      // Create a new customer for this user
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
      
      const generatedReferralCode = 'HOLY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      
      await prisma.customer.create({
        data: {
          phone: sanitizedPhone,
          name: user?.name || 'Valued Customer',
          userId: session.user.id,
          points: settings?.loyaltyEnabled ? (settings.signupBonus || 50) : 0,
          referralCode: generatedReferralCode
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link phone error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
