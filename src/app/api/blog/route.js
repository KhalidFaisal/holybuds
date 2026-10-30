import { NextResponse } from 'next/server';
import { getAllBlogPosts, deleteBlogPost, togglePublishBlogPost } from '@/lib/blogStorage';
import { requireAdmin } from '@/lib/auth';

function checkAdminAuth(request) {
  return requireAdmin(request);
}

// Public GET: list blog posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

    // If requesting unpublished, ensure user is admin
    const isAdmin = checkAdminAuth(request);
    const allowUnpublished = includeUnpublished && isAdmin;

    const data = await getAllBlogPosts({
      category,
      search,
      page,
      limit,
      includeUnpublished: allowUnpublished
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/blog:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// Admin DELETE: delete blog post
export async function DELETE(request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await deleteBlogPost(id);
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/blog:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete post' }, { status: 500 });
  }
}

// Admin PATCH: toggle publish state
export async function PATCH(request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, published } = body;

    if (!id || typeof published !== 'boolean') {
      return NextResponse.json({ error: 'ID and published boolean status are required' }, { status: 400 });
    }

    const updated = await togglePublishBlogPost(id, published);
    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error('Error in PATCH /api/blog:', error);
    return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 500 });
  }
}

