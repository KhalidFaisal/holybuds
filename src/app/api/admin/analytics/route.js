import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      summary: {
        revenue: { allTime: 0, thisMonth: 0, today: 0 },
        orders: { allTime: 0, thisMonth: 0, today: 0 },
        aov: 0
      },
      deliverySplit: {
        PICKUP: { count: 0, revenue: 0 },
        DELIVERY: { count: 0, revenue: 0 }
      },
      categorySplit: {},
      discounts: {},
      topProducts: {},
      trends: {
        last30Days: []
      }
    };

    // Initialize 30-day trend array
    const trendMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toISOString().split('T')[0];

      // Summary
      stats.summary.revenue.allTime += order.total;
      stats.summary.orders.allTime += 1;

      if (orderDate >= startOfMonth) {
        stats.summary.revenue.thisMonth += order.total;
        stats.summary.orders.thisMonth += 1;
      }
      if (orderDate >= startOfToday) {
        stats.summary.revenue.today += order.total;
        stats.summary.orders.today += 1;
      }

      // Delivery Split
      if (order.deliveryMethod === 'PICKUP') {
        stats.deliverySplit.PICKUP.count += 1;
        stats.deliverySplit.PICKUP.revenue += order.total;
      } else {
        stats.deliverySplit.DELIVERY.count += 1;
        stats.deliverySplit.DELIVERY.revenue += order.total;
      }

      // Discounts
      if (order.discountName && order.discountAmount > 0) {
        if (!stats.discounts[order.discountName]) {
          stats.discounts[order.discountName] = { count: 0, totalSaved: 0 };
        }
        stats.discounts[order.discountName].count += 1;
        stats.discounts[order.discountName].totalSaved += order.discountAmount;
      }

      // Trends
      if (trendMap.has(dateStr)) {
        const t = trendMap.get(dateStr);
        t.revenue += order.total;
        t.orders += 1;
      }

      // Items parsing (Categories & Products)
      for (const item of order.items) {
        const product = item.product;
        const lineRevenue = item.price * item.quantity;
        
        if (product) {
          // Category
          const cat = product.category || 'Uncategorized';
          if (!stats.categorySplit[cat]) {
            stats.categorySplit[cat] = { quantity: 0, revenue: 0 };
          }
          stats.categorySplit[cat].quantity += item.quantity;
          stats.categorySplit[cat].revenue += lineRevenue;

          // Products
          if (!stats.topProducts[product.id]) {
            stats.topProducts[product.id] = {
              id: product.id,
              name: product.name,
              category: product.category,
              quantity: 0,
              revenue: 0
            };
          }
          stats.topProducts[product.id].quantity += item.quantity;
          stats.topProducts[product.id].revenue += lineRevenue;
        }
      }
    }

    // Post processing calculations
    if (stats.summary.orders.allTime > 0) {
      stats.summary.aov = stats.summary.revenue.allTime / stats.summary.orders.allTime;
    }

    stats.trends.last30Days = Array.from(trendMap.values());
    
    // Sort and convert object maps to arrays
    const topProductsArr = Object.values(stats.topProducts).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const topDiscountsArr = Object.entries(stats.discounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
    
    return NextResponse.json({
      ...stats,
      topProducts: topProductsArr,
      topDiscounts: topDiscountsArr
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
