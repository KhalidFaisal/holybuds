import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { generateCoverImage, buildCoverImagePrompt } from '@/lib/imageGenerator';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { prompt, title, category, slug } = body || {};

    if (!title && !prompt) {
      return NextResponse.json(
        { error: 'Either title or prompt is required to generate a cover image' },
        { status: 400 }
      );
    }

    const finalPrompt = prompt || buildCoverImagePrompt({ title, category });

    console.log('[API] Generating cover image for:', title || prompt);

    const imageUrl = await generateCoverImage({
      prompt: finalPrompt,
      title,
      category,
      slug
    });

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image generation provider failed or is not configured. Please ensure your API key is valid.'
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      prompt: finalPrompt
    });
  } catch (error) {
    console.error('Error in /api/blog/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}

