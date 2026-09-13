export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/verify-password'],
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
