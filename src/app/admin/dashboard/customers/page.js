import prisma from '@/lib/prisma';
import CustomersTable from './CustomersTable';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const rawCustomers = await prisma.customer.findMany({
    orderBy: { totalOrders: 'desc' },
  });

  // Serialize Date objects for the client component
  const customers = rawCustomers.map(customer => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white mb-2">Customers & Loyalty</h1>
      </div>

      <CustomersTable initialCustomers={customers} />
    </div>
  );
}
