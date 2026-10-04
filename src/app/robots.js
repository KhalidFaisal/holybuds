export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/menu',
        '/product/',
        '/faq',
        '/privacy',
        '/terms',
        '/api/verify-password',
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/driver/',
        '/checkout/',
        '/account/',
        '/wholesale-auth/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
