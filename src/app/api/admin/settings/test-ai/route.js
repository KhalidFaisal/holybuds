import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { callAI } from '@/lib/ai';

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
    const model = data.model || 'agentrouter/gpt-5.5';

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    
    let responseData;
    try {
      responseData = await callAI([{ role: 'user', content: 'Say "Hello, World!"' }], {
        model,
        openRouterApiKey: data.openRouterApiKey || settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY,
        groqApiKey: data.groqApiKey || settings?.groqApiKey || process.env.GROQ_API_KEY
      });
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Failed to connect' }, { status: 500 });
    }

    const reply = responseData.choices?.[0]?.message?.content || 'No content returned';

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Test AI error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
