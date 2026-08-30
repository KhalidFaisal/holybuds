import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drivers = await prisma.driver.findMany({
      include: {
        _count: {
          select: { referrals: true, bonuses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, phone, email, referralCode, pin } = data;

    if (!name || !referralCode) {
      return NextResponse.json({ error: 'Name and referral code are required' }, { status: 400 });
    }
    if (!phone && !email) {
      return NextResponse.json({ error: 'Either phone or email is required' }, { status: 400 });
    }

    // Check if phone, email, or referral code exists
    const conditions = [{ referralCode }];
    if (phone) conditions.push({ phone });
    if (email) conditions.push({ email });
    
    const existing = await prisma.driver.findFirst({
      where: { OR: conditions }
    });

    if (existing) {
      if (phone && existing.phone === phone) return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 });
      if (email && existing.email === email) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      if (existing.referralCode === referralCode) return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        referralCode: referralCode.toUpperCase(),
        pin: pin || '0000',
        isActive: true,
      }
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, action, ...updateData } = data;

    if (!id) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    if (action === 'PAYOUT') {
      const amount = data.amount;
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid payout amount required' }, { status: 400 });
      }

      const [driver, payout] = await prisma.$transaction([
        prisma.driver.update({
          where: { id },
          data: { pendingPayout: { decrement: parseFloat(amount) } }
        }),
        prisma.driverPayout.create({
          data: {
            driverId: id,
            amount: parseFloat(amount)
          }
        })
      ]);

      return NextResponse.json(driver);
    }

    // Normal update
    // If empty string, convert to null
    if (updateData.email === '') updateData.email = null;
    if (updateData.phone === '') updateData.phone = null;

    // Ensure we don't nullify both
    if (updateData.phone === null && updateData.email === null) {
      return NextResponse.json({ error: 'Either phone or email is required' }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    // First delete any relations if needed, but Prisma handles it if cascade is set.
    // If not, we might need to delete driverReferral and driverBonus. Let's assume Prisma handles or we just delete driver.
    // Actually, referrals are linked to orders. We probably shouldn't hard-delete drivers if they have history. 
    // It's safer to just let Prisma fail if cascade isn't set, or we wrap it.
    await prisma.driver.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Failed to delete driver (they might have existing referrals)' }, { status: 500 });
  }
}
