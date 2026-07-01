import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { generateProductDescription } from '@/lib/ai';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, category, weight } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const description = await generateProductDescription(name, category, weight);

    return NextResponse.json({ description }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/products/generate-description:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate description' }, { status: 500 });
  }
}
