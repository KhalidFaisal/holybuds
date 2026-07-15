import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const pointsPerDollar = settings?.pointsPerDollar ?? 1;

    // Find orders that are not yet assigned a customer
    const orders = await prisma.order.findMany({
      where: { customerId: null },
      orderBy: { createdAt: 'asc' }
    });

    let migrated = 0;
    let newCustomers = 0;

    for (const order of orders) {
      if (!order.customerPhone) continue;

      const cleanPhone = order.customerPhone.replace(/\D/g, '');

      // Find or create customer
      let customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: order.customerName,
            phone: cleanPhone,
            points: 0,
            totalOrders: 0
          }
        });
        newCustomers++;
      }

      const earnedPoints = Math.max(0, Math.floor(order.total * pointsPerDollar));

      // Update customer stats
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          points: { increment: earnedPoints },
          totalOrders: { increment: 1 }
        }
      });

      // Update the order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          customerId: customer.id,
          pointsEarned: earnedPoints
        }
      });

      migrated++;
    }

    return NextResponse.json({ success: true, migratedOrders: migrated, newCustomersCreated: newCustomers });
  } catch (error) {
    console.error('Error during customer migration:', error);
    return NextResponse.json({ error: 'Failed to migrate customers', details: error.message }, { status: 500 });
  }
}
