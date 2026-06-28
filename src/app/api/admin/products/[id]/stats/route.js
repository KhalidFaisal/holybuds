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
    
    // In Next 15, `params` should be awaited. Since this code might be Next 15 (as we used await params in other places, wait, let me just await it to be safe)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { order: true }
        }
      }
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Calculate metrics
    let lastSold = null;
    let unitsSoldToday = 0;
    let unitsSoldThisWeek = 0;
    let totalUnitsSold = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    for (const item of product.orderItems) {
      if (item.order.status !== 'CANCELLED') {
        const orderDate = new Date(item.order.createdAt);
        
        // last sold
        if (!lastSold || orderDate > lastSold) lastSold = orderDate;
        
        // Units
        totalUnitsSold += item.quantity;
        
        if (orderDate >= startOfToday) unitsSoldToday += item.quantity;
        if (orderDate >= startOfWeek) unitsSoldThisWeek += item.quantity;
      }
    }

    const daysSinceCreation = Math.max(1, Math.floor((now - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)));
    const averageDailySales = (totalUnitsSold / daysSinceCreation).toFixed(2);
    
    const daysUntilOos = averageDailySales > 0 ? Math.floor(product.stock / averageDailySales) : '∞';

    return NextResponse.json({
      lastSold,
      unitsSoldToday,
      unitsSoldThisWeek,
      averageDailySales,
      daysUntilOos,
      stock: product.stock
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
