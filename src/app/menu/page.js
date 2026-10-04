import prisma from '@/lib/prisma';
import MenuClient from './MenuClient';
import { withProductDiscounts } from '@/lib/discounts';
import { cookies } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

const EFFECT_DESCRIPTIONS = {
  Sleep: 'Shop top-rated sleep aid cannabis strains, edibles, and tinctures for deep relaxation and insomnia relief.',
  Energy: 'Shop energizing sativa strains and uplifting cannabis edibles to boost daytime focus and vitality.',
  Relax: 'Browse calming indica and hybrid cannabis products formulated for stress relief and full-body relaxation.',
  Focus: 'Discover clarity and productivity with focus-enhancing cannabis flower, vapes, and edibles.',
  Creative: 'Unleash inspiration with creative, uplifting cannabis strains and concentrates.',
  Euphoric: 'Elevate your mood with premium euphoric cannabis flower, gummies, and cartridges.',
};

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category || null;
  const effect = sp?.effect || null;

  if (category && category !== 'ALL' && effect && effect !== 'ALL') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    const formattedEffect = effect.charAt(0).toUpperCase() + effect.slice(1);
    const title = `${formattedEffect} ${formattedCat} - Long Island Cannabis Delivery | HolyBuds`;
    const effectText = EFFECT_DESCRIPTIONS[formattedEffect] || `Shop ${formattedEffect.toLowerCase()} cannabis products.`;
    const description = `${effectText} Browse top-shelf ${formattedCat.toLowerCase()} available for same-day weed delivery across Long Island (Nassau & Suffolk) or pickup at HolyBuds.`;
    const canonical = `/menu?category=${encodeURIComponent(category)}&effect=${encodeURIComponent(effect)}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'HolyBuds Dispensary',
      },
    };
  }

  if (effect && effect !== 'ALL') {
    const formattedEffect = effect.charAt(0).toUpperCase() + effect.slice(1);
    const title = `Best Cannabis for ${formattedEffect} - Long Island Weed Delivery | HolyBuds`;
    const effectText = EFFECT_DESCRIPTIONS[formattedEffect] || `Shop top-rated cannabis products for ${formattedEffect.toLowerCase()}.`;
    const description = `${effectText} Same-day weed delivery across Nassau & Suffolk County, Long Island or fast pickup from HolyBuds Dispensary.`;
    const canonical = `/menu?effect=${encodeURIComponent(effect)}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'HolyBuds Dispensary',
      },
    };
  }

  if (category && category !== 'ALL') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    const title = `${formattedCat} Menu - Long Island Cannabis Delivery | HolyBuds`;
    const description = `Browse our curated selection of ${formattedCat.toLowerCase()} available for fast same-day weed delivery across Long Island (Nassau & Suffolk Counties) or pickup at HolyBuds Dispensary.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/menu?category=${encodeURIComponent(category)}`,
      },
      openGraph: {
        title,
        description,
        url: `/menu?category=${encodeURIComponent(category)}`,
        siteName: 'HolyBuds Dispensary',
      },
    };
  }

  return {
    title: 'Dispensary Menu & Online Ordering | Long Island Delivery | HolyBuds',
    description: 'Explore top-shelf cannabis flower, edibles, vapes, prerolls, and concentrates with same-day delivery across Long Island (Nassau & Suffolk) or pickup at HolyBuds.',
    alternates: {
      canonical: '/menu',
    },
    openGraph: {
      title: 'Dispensary Menu & Online Ordering | Long Island Delivery | HolyBuds',
      description: 'Explore top-shelf cannabis flower, edibles, vapes, prerolls, and concentrates with same-day delivery across Long Island (Nassau & Suffolk) or pickup at HolyBuds.',
      url: '/menu',
      siteName: 'HolyBuds Dispensary',
    },
  };
}

export default async function MenuPage({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category || null;
  const search = sp?.search || null;
  const effect = sp?.effect || null;

  const cookieStore = await cookies();
  const hasWholesaleAccess = cookieStore.get('wholesale_access')?.value === 'true';

  let wholesaleLocked = false;
  const where = { isVisible: true };
  
  if (category) {
    if (category.toLowerCase() === 'wholesale' && !hasWholesaleAccess) {
      wholesaleLocked = true;
      // Don't fetch any products if wholesale is locked
      where.id = 'none'; // Impossible condition to return 0 products
    } else {
      where.OR = [
        { category: category },
        { categories: { contains: `"${category}"` } }
      ];
    }
  } else {
    // Exclude wholesale from ALL categories if they don't have access
    if (!hasWholesaleAccess) {
      where.AND = [
        { category: { not: 'wholesale' } },
        { NOT: { categories: { contains: '"wholesale"' } } }
      ];
    }
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  const enrichedProducts = await withProductDiscounts(products);

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${siteUrl}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Menu',
      item: `${siteUrl}/menu`,
    },
  ];

  if (category && category !== 'ALL') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: formattedCat,
      item: `${siteUrl}/menu?category=${encodeURIComponent(category)}`,
    });
  } else if (effect && effect !== 'ALL') {
    const formattedEffect = effect.charAt(0).toUpperCase() + effect.slice(1);
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: `${formattedEffect} Cannabis`,
      item: `${siteUrl}/menu?effect=${encodeURIComponent(effect)}`,
    });
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MenuClient
        products={JSON.parse(JSON.stringify(enrichedProducts))}
        categories={JSON.parse(JSON.stringify(categories))}
        initialCategory={category}
        initialSearch={search}
        initialEffect={effect}
        wholesaleLocked={wholesaleLocked}
      />
    </>
  );
}
