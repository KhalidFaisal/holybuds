import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blogStorage';
import { notFound } from 'next/navigation';
import BlogPostClient from './BlogPostClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Holy Buds',
      description: 'The requested cannabis article could not be found.'
    };
  }

  const title = post.seoTitle || `${post.title} | Holy Buds`;
  const description = post.seoDescription || post.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      authors: [post.author || 'Holy Buds'],
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : []
    }
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug, true);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(slug, post.category, 3);

  // JSON-LD Structured Data for Google SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || undefined,
    datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Organization',
      name: post.author || 'Holy Buds'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Holy Buds',
      logo: {
        '@type': 'ImageObject',
        url: 'https://holybuds.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://holybuds.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} related={related} />
    </>
  );
}

