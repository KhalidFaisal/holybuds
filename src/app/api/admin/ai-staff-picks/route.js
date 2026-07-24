import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { callAI } from '@/lib/ai';

const JWT_SECRET = process.env.JWT_SECRET || 'pc-super-secret-key-change-in-production';

export async function POST(request) {
  try {
    // 1. Authenticate (could be called by admin, cron, or public trigger)
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isPublicTrigger = request.headers.get('x-public-trigger') === 'true';
    
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (!settings) settings = { aiStaffPicksEnabled: false };

    if (!isCron && !isPublicTrigger) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    if (isPublicTrigger) {
      if (!settings.aiStaffPicksEnabled) {
        return NextResponse.json({ error: 'AI Staff Picks disabled' }, { status: 403 });
      }
      
      const lastUpdate = settings.aiStaffPicksLastUpdate;
      if (lastUpdate) {
        const daysSinceLastUpdate = (new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUpdate < 7) {
          return NextResponse.json({ error: 'Rate limited: Update already ran within the last 7 days.' }, { status: 429 });
        }
      }
    }

    // 2. Fetch all active products
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        stock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        effects: true
      }
    });

    if (products.length < 10) {
      return NextResponse.json({ error: 'Not enough products to pick 10.' }, { status: 400 });
    }

    // 3. Format product list for AI
    const productListText = products.map(p => 
      `ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: $${p.price} | Effects: ${p.effects}`
    ).join('\n');

    const prompt = `You are a cannabis sommelier. Review the following available inventory and select exactly 10 exciting, diverse products to feature as our "Staff Picks" for the week. 
Try to pick a good mix of flowers, edibles, and varying price points if possible.

INVENTORY:
${productListText}

Return ONLY a raw JSON object with a single array called "picks" containing exactly 10 product IDs as strings. No markdown formatting, no code blocks, just raw JSON.
Example: {"picks":["id1","id2",...]}`;

    // 4. Call AI
    const messages = [
      { role: 'system', content: 'You are a helpful JSON-only API. You output raw JSON.' },
      { role: 'user', content: prompt }
    ];

    const aiResponse = await callAI(messages, {});

    const reply = aiResponse.choices[0].message.content;
    
    // Parse the JSON (handle potential markdown blocks if AI disobeys)
    let parsed;
    try {
      const cleanReply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanReply);
    } catch (e) {
      console.error("AI response failed to parse:", reply);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!parsed.picks || !Array.isArray(parsed.picks) || parsed.picks.length === 0) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    const selectedIds = parsed.picks.slice(0, 10);

    // 5. Update Database
    // Set featured = false for all
    await prisma.product.updateMany({
      where: { featured: true },
      data: { featured: false }
    });

    // Set featured = true for selected
    await prisma.product.updateMany({
      where: { id: { in: selectedIds } },
      data: { featured: true }
    });

    // Update settings timestamp
    await prisma.siteSettings.update({
      where: { id: 'global' },
      data: { aiStaffPicksLastUpdate: new Date() }
    });

    return NextResponse.json({ success: true, pickedIds: selectedIds });
  } catch (error) {
    console.error('AI Staff Picks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
