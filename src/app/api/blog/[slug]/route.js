import { NextResponse } from 'next/server';
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blogStorage';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const post = await getBlogPostBySlug(slug, true);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const related = await getRelatedPosts(slug, post.category, 3);

    return NextResponse.json({ post, related });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

