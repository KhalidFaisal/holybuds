import { getAllBlogPosts } from '@/lib/blogStorage';
import BlogClient from './BlogClient';

export const metadata = {
  title: 'Cannabis Journal & Guides | Holy Buds Long Island',
  description: 'Explore expert cannabis education, strain reviews, edibles dosing guides, and Long Island same-day weed delivery insights from Holy Buds.',
  openGraph: {
    title: 'Cannabis Journal & Guides | Holy Buds Long Island',
    description: 'Expert cannabis guides, strain reviews, and Long Island weed delivery knowledge.',
    type: 'website',
    url: 'https://holybuds.com/blog'
  }
};

export default async function BlogPage() {
  const initialData = await getAllBlogPosts({ limit: 24 });
  return <BlogClient initialData={initialData} />;
}

