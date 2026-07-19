import { NextResponse } from 'next/server';
import { autoTagProduct } from '@/lib/ai';
import { requireAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, category } = await request.json();

    if (!name && !description) {
      return NextResponse.json({ error: 'Name or description required' }, { status: 400 });
    }

    const effects = await autoTagProduct(name, category, description);
    return NextResponse.json({ effects });

  } catch (error) {
    console.error('Auto-effects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
