import { getAllBlogPosts } from '@/lib/blogStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holybuds.net';

  let posts = [];
  try {
    const data = await getAllBlogPosts({ limit: 50 });
    posts = data?.posts || [];
  } catch (err) {
    console.error('Failed to load posts for RSS feed:', err.message);
  }

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = post.createdAt ? new Date(post.createdAt).toUTCString() : new Date().toUTCString();
      const imageUrl = post.coverImage
        ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
        : null;

      const mediaEnclosure = imageUrl
        ? `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />
      <media:content url="${escapeXml(imageUrl)}" medium="image" />`
        : '';

      return `    <item>
      <title><![CDATA[${post.title || ''}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt || post.title || ''}]]></description>
      <category><![CDATA[${post.category || 'Cannabis 101'}]]></category>
      ${mediaEnclosure}
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Holy Buds Cannabis Journal</title>
    <link>${siteUrl}/blog</link>
    <description>Authoritative cannabis education, strain guides, dosing breakdowns, and Long Island weed delivery insights.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/og-image.jpg</url>
      <title>Holy Buds Cannabis Journal</title>
      <link>${siteUrl}/blog</link>
    </image>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

