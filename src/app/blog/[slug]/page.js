import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blogStorage';
import { notFound } from 'next/navigation';
import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holybuds.net';

/**
 * Parses FAQ questions and answers from article markdown content for FAQPage schema.
 * Matches sections starting with '## Frequently Asked Questions' or '## FAQ'.
 */
export function extractFaqsFromMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];

  const faqHeadingRegex = /##\s*(?:Frequently Asked Questions|FAQ|Common Questions|Frequently Asked)/i;
  const match = markdown.match(faqHeadingRegex);
  if (!match) return [];

  const faqSection = markdown.slice(match.index + match[0].length);
  const nextH2 = faqSection.search(/\n##\s+[^\n]+/);
  const faqBody = nextH2 !== -1 ? faqSection.slice(0, nextH2) : faqSection;

  const questionRegex = /###\s*([^\n?]+(?:\?)?)\s*\n+([\s\S]*?)(?=(?:\n###\s*|$))/g;
  const faqs = [];
  let qMatch;
  while ((qMatch = questionRegex.exec(faqBody)) !== null) {
    const question = qMatch[1].trim();
    const answer = qMatch[2]
      .replace(/[*_#`[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  return faqs;
}

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
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'en_US',
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
  const faqs = extractFaqsFromMarkdown(post.content);

  // JSON-LD Structured Data for Google Article SEO
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
        url: `${siteUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`
    }
  };

  // JSON-LD Structured Data for Google Position Zero FAQ Rich Snippets
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <BlogPostClient post={post} related={related} />
    </>
  );
}
