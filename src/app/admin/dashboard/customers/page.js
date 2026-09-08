import prisma from '@/lib/prisma';
import CustomersTable from './CustomersTable';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const [rawCustomers, settings] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { totalOrders: 'desc' },
      include: { user: true },
    }),
    prisma.siteSettings.findUnique({ where: { id: 'global' } })
  ]);

  const timezone = settings?.timezone || 'UTC';

  // Serialize Date objects for the client component
  const customers = rawCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.user?.email || null,
    address: customer.address || '',
    points: customer.points || 0,
    storeCredit: customer.storeCredit || 0,
    totalOrders: customer.totalOrders || 0,
    referralCode: customer.referralCode || null,
    referredByCode: customer.referredByCode || null,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <CustomersTable initialCustomers={customers} timezone={timezone} />
    </div>
  );
}
