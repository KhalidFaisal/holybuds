import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    
    const resolvedParams = await params;
    const { phone } = resolvedParams;
    const decodedPhone = decodeURIComponent(phone);

    const orders = await prisma.order.findMany({
      where: { customerPhone: decodedPhone },
      orderBy: { createdAt: 'desc' }
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ flags: [] });
    }

    let lifetimeSpend = 0;
    let cancelCountInLast7Days = 0;
    let ordersInLast7Days = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const order of orders) {
      const isRecent = new Date(order.createdAt) >= sevenDaysAgo;
      
      if (order.status === 'CANCELLED') {
        if (isRecent) cancelCountInLast7Days++;
      } else {
        lifetimeSpend += order.total;
      }
      
      if (isRecent && order.status !== 'CANCELLED') {
        ordersInLast7Days++;
      }
    }

    const flags = [];
    
    flags.push(`💰 Lifetime Spend: $${lifetimeSpend.toFixed(2)}`);

    if (lifetimeSpend > 1000) {
      flags.push('⭐ VIP');
    }

    if (cancelCountInLast7Days >= 1) {
      flags.push('⚠ Frequent Cancels');
    }

    if (ordersInLast7Days >= 2) {
      flags.push('🔥 Orders Weekly');
    }

    return NextResponse.json({ flags });

  } catch (error) {
    console.error('Flags error:', error);
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }
}
