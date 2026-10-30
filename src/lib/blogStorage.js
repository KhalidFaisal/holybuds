import prisma from '@/lib/prisma';
import { PRESEEDED_BLOGS } from '@/lib/blogGenerator';

/**
 * Fetch all blog posts with filtering, search, and pagination.
 * Gracefully falls back to pre-seeded content if the database table is not yet initialized.
 */
export async function getAllBlogPosts({
  category = 'All',
  search = '',
  limit = 20,
  page = 1,
  includeUnpublished = false
} = {}) {
  try {
    if (prisma && prisma.blogPost) {
      const where = {};
      if (!includeUnpublished) {
        where.published = true;
      }
      if (category && category !== 'All') {
        where.category = { equals: category, mode: 'insensitive' };
      }
      if (search && search.trim() !== '') {
        const query = search.trim();
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ];
      }

      const total = await prisma.blogPost.count({ where });
      const posts = await prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      if (posts && posts.length > 0) {
        return { posts, total, page, totalPages: Math.ceil(total / limit) };
      }
    }
  } catch (err) {
    console.warn('Prisma BlogPost query failed, falling back to preseeded data:', err.message);
  }

  // Fallback to preseeded blogs
  let filtered = [...PRESEEDED_BLOGS];
  if (!includeUnpublished) {
    filtered = filtered.filter(p => p.published);
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    posts: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get a single blog post by slug.
 */
export async function getBlogPostBySlug(slug, incrementView = false) {
  if (!slug) return null;

  try {
    if (prisma && prisma.blogPost) {
      const post = await prisma.blogPost.findUnique({
        where: { slug }
      });

      if (post) {
        if (incrementView) {
          try {
            await prisma.blogPost.update({
              where: { slug },
              data: { views: { increment: 1 } }
            });
            post.views += 1;
          } catch (viewErr) {
            console.warn('Failed to increment blog post view:', viewErr.message);
          }
        }
        return post;
      }
    }
  } catch (err) {
    console.warn('Prisma BlogPost slug lookup failed, checking preseeded data:', err.message);
  }

  // Fallback to pre-seeded blogs
  const found = PRESEEDED_BLOGS.find(p => p.slug === slug);
  if (found && incrementView) {
    found.views = (found.views || 0) + 1;
  }
  return found || null;
}

/**
 * Save / create a new blog post in PostgreSQL
 */
export async function saveBlogPost(postData) {
  if (!prisma || !prisma.blogPost) {
    throw new Error('Database client for BlogPost is unavailable.');
  }

  return await prisma.blogPost.create({
    data: {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category || 'Cannabis 101',
      tags: typeof postData.tags === 'string' ? postData.tags : JSON.stringify(postData.tags || []),
      coverImage: postData.coverImage || '',
      readTime: postData.readTime || '5 min read',
      author: postData.author || 'Holy Buds Team',
      published: postData.published ?? true,
      views: postData.views || 0,
      seoTitle: postData.seoTitle || postData.title,
      seoDescription: postData.seoDescription || postData.excerpt
    }
  });
}

/**
 * Delete a blog post by ID
 */
export async function deleteBlogPost(id) {
  if (!prisma || !prisma.blogPost) {
    throw new Error('Database client for BlogPost is unavailable.');
  }

  return await prisma.blogPost.delete({
    where: { id }
  });
}

/**
 * Toggle published state of a blog post
 */
export async function togglePublishBlogPost(id, published) {
  if (!prisma || !prisma.blogPost) {
    throw new Error('Database client for BlogPost is unavailable.');
  }

  return await prisma.blogPost.update({
    where: { id },
    data: { published }
  });
}

/**
 * Get related posts for the reader page
 */
export async function getRelatedPosts(currentSlug, category, limit = 3) {
  try {
    if (prisma && prisma.blogPost) {
      const posts = await prisma.blogPost.findMany({
        where: {
          published: true,
          slug: { not: currentSlug },
          category: category ? { equals: category, mode: 'insensitive' } : undefined
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      if (posts && posts.length > 0) return posts;
    }
  } catch (err) {
    console.warn('Prisma related posts query failed:', err.message);
  }

  return PRESEEDED_BLOGS.filter(p => p.slug !== currentSlug && p.published).slice(0, limit);
}

