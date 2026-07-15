require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting migration...');

  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  const pointsPerDollar = settings?.pointsPerDollar || 1;

  // Find orders that are not yet assigned a customer
  const orders = await prisma.order.findMany({
    where: { customerId: null },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${orders.length} orders to process.`);

  for (const order of orders) {
    if (!order.customerPhone) {
      console.warn(`Skipping order ${order.orderNumber} - no phone number`);
      continue;
    }

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
      console.log(`Created new customer: ${customer.name} (${customer.phone})`);
    }

    const subtotal = order.total;
    const earnedPoints = Math.max(0, Math.floor(subtotal * pointsPerDollar));

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

    console.log(`Updated order ${order.orderNumber} - Awarded ${earnedPoints} points to ${customer.phone}`);
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
