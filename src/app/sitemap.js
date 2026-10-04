import prisma from '@/lib/prisma';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

  const products = await prisma.product.findMany({
    where: {
      isVisible: true,
      NOT: [
        { category: { equals: 'wholesale', mode: 'insensitive' } },
        { categories: { contains: '"wholesale"' } },
      ],
    },
    select: { id: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      NOT: { slug: { equals: 'wholesale', mode: 'insensitive' } },
    },
    select: { slug: true, updatedAt: true },
  });

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/menu?category=${encodeURIComponent(category.slug)}`,
    lastModified: category.updatedAt,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const availableEffects = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

  const effectUrls = availableEffects.map((effect) => ({
    url: `${baseUrl}/menu?effect=${encodeURIComponent(effect)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...effectUrls,
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
