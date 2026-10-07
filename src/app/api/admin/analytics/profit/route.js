import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const tz = settings?.timezone || 'UTC';

    // Helper to format date in store's timezone
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

    const getTzFullFormatted = (date) => {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(date);
    };

    const now = new Date();
    const todayStr = getTzDateStr(now); // Store's today (YYYY-MM-DD)
    const currentSiteTimeFormatted = getTzFullFormatted(now);

    // Hard constraint: ONLY orders from today onwards in site time (no previous sales)
    // Fetch orders from the last 48 hours to safely capture today's start across all global timezones
    const safetyCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: safetyCutoff },
        status: { notIn: ['CANCELLED', 'Cancelled', 'cancelled'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter strictly to orders placed today onwards in the site timezone
    const eligibleOrders = orders.filter((order) => {
      const orderDateStr = getTzDateStr(new Date(order.createdAt));
      return orderDateStr >= todayStr;
    });

    // Accumulators
    let totalRevenue = 0;
    let totalCOGS = 0;
    let trackedUnitsSold = 0;
    let untrackedUnitsSold = 0;
    const trackedOrderIds = new Set();

    const categoryMap = {};
    const productProfitMap = {};
    const missingCostMap = {};
    const timelineMap = new Map();

    const ensureTimelineEntry = (dateKey) => {
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: dateKey,
          revenue: 0,
          cogs: 0,
          profit: 0,
          orders: 0,
          unitsSold: 0,
        });
      }
      return timelineMap.get(dateKey);
    };

    // Ensure today's entry exists
    ensureTimelineEntry(todayStr);

    for (const order of eligibleOrders) {
      const dateKey = getTzDateStr(new Date(order.createdAt));
      const tEntry = ensureTimelineEntry(dateKey);
      let orderHadTrackedItems = false;

      for (const item of order.items) {
        const qty = item.quantity || 1;
        const unitCost = item.costPrice > 0 ? item.costPrice : (item.product?.costPrice || 0);

        // ONLY calculate for products where costs have been added!
        if (unitCost <= 0) {
          untrackedUnitsSold += qty;
          if (item.product) {
            const pid = item.product.id;
            if (!missingCostMap[pid]) {
              missingCostMap[pid] = {
                id: pid,
                name: item.product.name,
                category: item.product.category,
                price: item.product.price,
                unitsSoldWithoutCost: 0,
              };
            }
            missingCostMap[pid].unitsSoldWithoutCost += qty;
          }
          continue; // Skip items without cost price so they don't corrupt margins
        }

        // Tracked item with valid cost
        orderHadTrackedItems = true;
        const lineRevenue = item.price * qty;
        const itemCOGS = unitCost * qty;
        const itemProfit = lineRevenue - itemCOGS;

        totalRevenue += lineRevenue;
        totalCOGS += itemCOGS;
        trackedUnitsSold += qty;

        tEntry.revenue += lineRevenue;
        tEntry.cogs += itemCOGS;
        tEntry.profit += itemProfit;
        tEntry.unitsSold += qty;

        // Category Breakdown
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

        // Product Breakdown
        if (item.product) {
          const pid = item.product.id;
          if (!productProfitMap[pid]) {
            productProfitMap[pid] = {
              id: pid,
              name: item.product.name,
              category: item.product.category,
              image: item.product.image || '',
              price: item.product.price,
              costPrice: unitCost,
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

      if (orderHadTrackedItems) {
        trackedOrderIds.add(order.id);
        tEntry.orders += 1;
      }
    }

    const totalProfit = totalRevenue - totalCOGS;
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalOrdersCount = trackedOrderIds.size;
    const avgProfitPerOrder = totalOrdersCount > 0 ? totalProfit / totalOrdersCount : 0;

    // Timeline array
    const timeline = Array.from(timelineMap.values()).map((day) => ({
      ...day,
      marginPercent: day.revenue > 0 ? Math.round((day.profit / day.revenue) * 100) : 0,
    }));

    // Categories sorted by profit
    const categoryProfit = Object.values(categoryMap)
      .map((c) => ({
        ...c,
        marginPercent: c.revenue > 0 ? Math.round((c.profit / c.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    // Products sorted by dollar profit
    const topProfitableProducts = Object.values(productProfitMap)
      .map((p) => ({
        ...p,
        marginPercent: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    // Highest margin gems
    const highestMarginProducts = Object.values(productProfitMap)
      .map((p) => ({
        ...p,
        marginPercent: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.marginPercent - a.marginPercent);

    return NextResponse.json({
      siteTimezone: tz,
      siteTodayDate: todayStr,
      currentSiteTimeFormatted,
      summary: {
        totalRevenue,
        totalCOGS,
        totalProfit,
        marginPercent,
        totalOrdersCount,
        trackedUnitsSold,
        untrackedUnitsSold,
        avgProfitPerOrder,
      },
      timeline,
      categoryProfit,
      topProfitableProducts,
      highestMarginProducts,
      missingCostProducts: Object.values(missingCostMap),
    });
  } catch (error) {
    console.error('Profit analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate profit analytics' },
      { status: 500 }
    );
  }
}
