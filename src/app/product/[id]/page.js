import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import ProductClient from './ProductClient';
import { withProductDiscounts } from '@/lib/discounts';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  // Wait for params in Next 15+ App Router
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const isAdmin = token ? verifyToken(token) : false;

  if (!product || (!product.isVisible && !isAdmin)) {
    notFound();
  }

  const enrichedProduct = await withProductDiscounts(product);

  return <ProductClient product={enrichedProduct} />;
}
