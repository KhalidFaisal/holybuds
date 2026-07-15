import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import CustomersTable from './CustomersTable';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { totalOrders: 'desc' },
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Customers & Loyalty</h1>
        </div>

        <CustomersTable initialCustomers={customers} />
      </div>
    </div>
  );
}
