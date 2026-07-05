import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pc-super-secret-key-change-in-production';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const model = data.model || 'openrouter/free';

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const finalApiKey = settings?.openRouterApiKey || OPENROUTER_API_KEY;

    if (!finalApiKey) {
      return NextResponse.json({ error: 'OpenRouter API Key is missing. Please add one in settings.' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "Hello, World!"' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        // Extract readable message from OpenRouter format if possible
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          if (errorJson.error.metadata?.raw) {
            errorMessage += ` - ${errorJson.error.metadata.raw}`;
          }
        }
      } catch (e) {
        // Not JSON
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || 'No content returned';

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Test AI error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
