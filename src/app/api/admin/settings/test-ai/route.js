import { NextResponse } from 'next/server';
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

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API Key is missing in environment.' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "Hello, World!"' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API Error: ${errorText}` }, { status: response.status });
    }

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || 'No content returned';

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Test AI error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
