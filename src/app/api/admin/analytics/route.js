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
        status: { notIn: ['CANCELLED', 'Cancelled', 'cancelled'] }
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

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const tz = settings?.timezone || 'UTC';

    const getTzDateStr = (date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const y = parts.find(p => p.type === 'year').value;
      const m = parts.find(p => p.type === 'month').value;
      const d = parts.find(p => p.type === 'day').value;
      return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const todayStr = getTzDateStr(now);
    const currentMonthStr = todayStr.substring(0, 7);

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
      topCustomers: {},
      trends: {
        last30Days: []
      }
    };

    // Initialize 30-day trend array using tz string tracking
    const trendMap = new Map();
    const msInDay = 86400000;
    let currentMs = now.getTime();
    const trendDates = [];
    // Go backwards in time to collect 30 unique day strings in this timezone
    while (trendDates.length < 30 && currentMs > (now.getTime() - 40 * msInDay)) {
      const dStr = getTzDateStr(new Date(currentMs));
      if (!trendDates.includes(dStr)) {
        trendDates.push(dStr);
      }
      currentMs -= (msInDay / 2); // Step back 12 hours at a time to safely avoid DST skips
    }
    trendDates.reverse();
    trendDates.forEach(dateStr => trendMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 }));

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const dateStr = getTzDateStr(orderDate);
      const monthStr = dateStr.substring(0, 7);

      // Summary
      stats.summary.revenue.allTime += order.total;
      stats.summary.orders.allTime += 1;

      if (monthStr === currentMonthStr) {
        stats.summary.revenue.thisMonth += order.total;
        stats.summary.orders.thisMonth += 1;
      }
      if (dateStr === todayStr) {
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

      // Customers
      if (order.customerPhone) {
        if (!stats.topCustomers[order.customerPhone]) {
          stats.topCustomers[order.customerPhone] = {
            phone: order.customerPhone,
            name: order.customerName,
            ordersCount: 0,
            revenue: 0
          };
        }
        stats.topCustomers[order.customerPhone].ordersCount += 1;
        stats.topCustomers[order.customerPhone].revenue += order.total;
        stats.topCustomers[order.customerPhone].name = order.customerName; // Keep latest name
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
              stock: product.stock,
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
    const topProductsArr = Object.values(stats.topProducts)
      .filter(p => p.stock > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    const topDiscountsArr = Object.entries(stats.discounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
      
    const topCustomersArr = Object.values(stats.topCustomers)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return NextResponse.json({
      ...stats,
      topProducts: topProductsArr,
      topDiscounts: topDiscountsArr,
      topCustomers: topCustomersArr
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
