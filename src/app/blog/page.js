import { getAllBlogPosts } from '@/lib/blogStorage';
import BlogClient from './BlogClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holybuds.net';

export const metadata = {
  title: 'Cannabis Journal & Guides | Holy Buds Long Island',
  description: 'Explore expert cannabis education, strain reviews, edibles dosing guides, and Long Island same-day weed delivery insights from Holy Buds.',
  alternates: {
    canonical: `${siteUrl}/blog`
  },
  openGraph: {
    title: 'Cannabis Journal & Guides | Holy Buds Long Island',
    description: 'Expert cannabis guides, strain reviews, and Long Island weed delivery knowledge.',
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/blog`
  }
};

export default async function BlogPage() {
  const initialData = await getAllBlogPosts({ limit: 50 });
  return <BlogClient initialData={initialData} />;
}
