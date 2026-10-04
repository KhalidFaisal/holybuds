import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import ProductClient from './ProductClient';
import { withProductDiscounts } from '@/lib/discounts';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

export async function generateMetadata({ params }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      weight: true,
      description: true,
      image: true,
      price: true,
      isVisible: true,
    },
  });

  if (!product || !product.isVisible) {
    return {
      title: 'Product Not Found | HolyBuds',
      description: 'The requested product could not be found at HolyBuds Dispensary.',
    };
  }

  const weightStr = product.weight ? ` (${product.weight})` : '';
  const title = `${product.name}${weightStr} - Long Island Cannabis Delivery | HolyBuds`;
  const cleanDesc = product.description
    ? product.description.replace(/\s+/g, ' ').trim().slice(0, 130)
    : `Shop ${product.name} ${product.category}`;
  const description = `${cleanDesc}. Same-day cannabis delivery across Nassau & Suffolk County, Long Island or fast pickup from HolyBuds.`;

  const ogImages = product.image ? [{ url: product.image, alt: `${product.name} - HolyBuds Dispensary Long Island` }] : [];

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/product/${id}`,
      siteName: 'HolyBuds Dispensary',
      locale: 'en_US',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

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

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name}${product.weight ? ` (${product.weight})` : ''}`,
    image: product.image ? [product.image] : [],
    description: product.description || `Premium ${product.category} from HolyBuds dispensary.`,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'HolyBuds',
    },
    offers: {
      '@type': 'Offer',
      price: enrichedProduct.discountedPrice || enrichedProduct.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/product/${id}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'HolyBuds Dispensary',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductClient product={enrichedProduct} />
    </>
  );
}
