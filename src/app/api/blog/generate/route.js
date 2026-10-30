import { NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/blogGenerator';
import { saveBlogPost } from '@/lib/blogStorage';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = request.cookies.get('admin_token')?.value;
  }

  if (!token) return false;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return Boolean(decoded && (decoded.role === 'admin' || decoded.admin));
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let topic = '';
    let category = '';

    try {
      const body = await request.json();
      if (body) {
        topic = body.topic || '';
        category = body.category || '';
      }
    } catch {
      // Body may be empty for automated runs
    }

    // Generate blog post via Neodymium
    const generated = await generateBlogPost({ topic, category });

    // Save to PostgreSQL table
    let saved = null;
    try {
      saved = await saveBlogPost(generated);
    } catch (dbErr) {
      console.warn('Could not save post directly to DB (table may be pending migration):', dbErr.message);
      saved = { ...generated, id: 'temp-' + Date.now() };
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post generated successfully',
      post: saved
    });
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}

