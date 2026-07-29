import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elevated-secret-key-change-in-production';

// Helper to authenticate admin
const authenticateAdmin = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (e) {
    return false;
  }
};

export async function GET(request) {
  if (!authenticateAdmin(request)) {
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
  if (!authenticateAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, phone, referralCode, pin } = data;

    if (!name || !phone || !referralCode) {
      return NextResponse.json({ error: 'Name, phone, and referral code are required' }, { status: 400 });
    }

    // Check if phone or referral code exists
    const existing = await prisma.driver.findFirst({
      where: {
        OR: [{ phone }, { referralCode }]
      }
    });

    if (existing) {
      if (existing.phone === phone) return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 });
      if (existing.referralCode === referralCode) return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
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
  if (!authenticateAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, action, ...updateData } = data;

    if (!id) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    if (action === 'PAYOUT') {
      const { amount } = data;
      // Mark pending payout as 0 or decrement by amount
      const driver = await prisma.driver.update({
        where: { id },
        data: { 
          pendingPayout: amount ? { decrement: parseFloat(amount) } : 0 
        }
      });
      return NextResponse.json(driver);
    }

    // Normal update
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
  if (!authenticateAdmin(request)) {
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
