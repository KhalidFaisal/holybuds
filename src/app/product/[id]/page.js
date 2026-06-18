import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductClient from './ProductClient';
import { withProductDiscounts } from '@/lib/discounts';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  // Wait for params in Next 15+ App Router
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const enrichedProduct = await withProductDiscounts(product);

  return <ProductClient product={enrichedProduct} />;
}
