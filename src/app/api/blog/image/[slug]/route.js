import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new NextResponse('Slug is required', { status: 400 });
    }

    if (!prisma || !prisma.blogPost) {
      return new NextResponse('Database unavailable', { status: 503 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { coverImage: true, updatedAt: true }
    });

    if (!post || !post.coverImage) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const cover = post.coverImage.trim();

    // If already an external HTTP(S) URL, redirect directly
    if (cover.startsWith('http://') || cover.startsWith('https://')) {
      return NextResponse.redirect(cover, { status: 307 });
    }

    // If base64 data URI (e.g. data:image/png;base64,xxxx)
    if (cover.startsWith('data:image/')) {
      const matches = cover.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Last-Modified': post.updatedAt ? new Date(post.updatedAt).toUTCString() : new Date().toUTCString()
          }
        });
      }
    }

    return new NextResponse('Unsupported image format', { status: 400 });
  } catch (error) {
    console.error('Error serving blog image:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
