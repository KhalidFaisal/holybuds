import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await request.json();
    
    if (!data.name || !data.type || data.value == null || !data.targetType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newDiscount = await prisma.discount.create({
      data: {
        name: data.name,
        type: data.type,
        value: parseFloat(data.value),
        minOrderValue: parseFloat(data.minOrderValue || 0),
        minItemQuantity: parseInt(data.minItemQuantity || 0, 10),
        targetType: data.targetType,
        targetCategory: data.targetCategory || null,
        targetProductIds: data.targetProductIds || null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
