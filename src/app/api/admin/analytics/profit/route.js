import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 'today', '7d', '30d', 'month', 'all'
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const tz = settings?.timezone || 'UTC';

    const getTzDateStr = (date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const y = parts.find((p) => p.type === 'year').value;
      const m = parts.find((p) => p.type === 'month').value;
      const d = parts.find((p) => p.type === 'day').value;
      return `${y}-${m}-${d}`;
    };

    const now = new Date();

    // Determine Date Filter Range
    let startDate = null;
    let endDate = null;

    if (customStart) {
      startDate = new Date(customStart + 'T00:00:00Z');
      if (customEnd) {
        endDate = new Date(customEnd + 'T23:59:59Z');
      }
    } else if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }
    // 'all' leaves startDate = null

    const orderWhere = {
      status: { notIn: ['CANCELLED', 'Cancelled', 'cancelled'] },
    };
    if (startDate) {
      orderWhere.createdAt = { gte: startDate };
      if (endDate) {
        orderWhere.createdAt.lte = endDate;
      }
    }

    // Fetch Orders with Items & Product info
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Initialize Accumulators
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalDiscounts = 0;
    let totalOrdersCount = orders.length;

    const categoryMap = {};
    const productProfitMap = {};
    const timelineMap = new Map();

    // Helper to format days in timeline
    const ensureTimelineEntry = (dateKey) => {
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: dateKey,
          revenue: 0,
          cogs: 0,
          profit: 0,
          orders: 0,
        });
      }
      return timelineMap.get(dateKey);
    };

    // Prepopulate timeline days if 7d, 30d, or month
    if (period === '7d' || period === '30d') {
      const daysCount = period === '7d' ? 7 : 30;
      const msInDay = 86400000;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * msInDay);
        ensureTimelineEntry(getTzDateStr(d));
      }
    }

    // Process Orders
    for (const order of orders) {
      const dateKey = getTzDateStr(new Date(order.createdAt));
      const tEntry = ensureTimelineEntry(dateKey);

      totalRevenue += order.total;
      totalDiscounts += (order.discountAmount || 0) + (order.creditUsed || 0);
      tEntry.revenue += order.total;
      tEntry.orders += 1;

      let orderCOGS = 0;

      for (const item of order.items) {
        const qty = item.quantity || 1;
        // Prioritize order snapshot cost; fallback to current product cost if historical order had 0
        const unitCost = item.costPrice > 0 ? item.costPrice : (item.product?.costPrice || 0);
        const itemCOGS = unitCost * qty;
        const lineRevenue = item.price * qty;
        const itemProfit = lineRevenue - itemCOGS;

        orderCOGS += itemCOGS;

        // Category breakdown
        const cat = item.product?.category || 'Other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            category: cat,
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
          };
        }
        categoryMap[cat].unitsSold += qty;
        categoryMap[cat].revenue += lineRevenue;
        categoryMap[cat].cogs += itemCOGS;
        categoryMap[cat].profit += itemProfit;

        // Product breakdown
        if (item.product) {
          const pid = item.product.id;
          if (!productProfitMap[pid]) {
            productProfitMap[pid] = {
              id: pid,
              name: item.product.name,
              category: item.product.category,
              image: item.product.image || '',
              price: item.product.price,
              costPrice: item.product.costPrice || 0,
              unitsSold: 0,
              revenue: 0,
              cogs: 0,
              profit: 0,
            };
          }
          productProfitMap[pid].unitsSold += qty;
          productProfitMap[pid].revenue += lineRevenue;
          productProfitMap[pid].cogs += itemCOGS;
          productProfitMap[pid].profit += itemProfit;
        }
      }

      totalCOGS += orderCOGS;
      tEntry.cogs += orderCOGS;
      tEntry.profit += (order.total - orderCOGS);
    }

    // Final calculations
    const totalProfit = totalRevenue - totalCOGS;
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgProfitPerOrder = totalOrdersCount > 0 ? totalProfit / totalOrdersCount : 0;

    // Timeline entries
    const timeline = Array.from(timelineMap.values()).map((day) => ({
      ...day,
      marginPercent: day.revenue > 0 ? Math.round((day.profit / day.revenue) * 100) : 0,
    }));

    // Format Categories
    const categoryProfit = Object.values(categoryMap)
      .map((c) => ({
        ...c,
        marginPercent: c.revenue > 0 ? Math.round((c.profit / c.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    // Format Top Profitable Products
    const topProfitableProducts = Object.values(productProfitMap)
      .map((p) => ({
        ...p,
        marginPercent: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 15);

    // High Margin Products
    const highestMarginProducts = Object.values(productProfitMap)
      .filter((p) => p.unitsSold > 0 && p.cogs > 0)
      .map((p) => ({
        ...p,
        marginPercent: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.marginPercent - a.marginPercent)
      .slice(0, 10);

    return NextResponse.json({
      period,
      summary: {
        totalRevenue,
        totalCOGS,
        totalProfit,
        marginPercent,
        avgProfitPerOrder,
        totalDiscounts,
        totalOrdersCount,
      },
      timeline,
      categoryProfit,
      topProfitableProducts,
      highestMarginProducts,
    });
  } catch (error) {
    console.error('Profit analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate profit analytics' },
      { status: 500 }
    );
  }
}
