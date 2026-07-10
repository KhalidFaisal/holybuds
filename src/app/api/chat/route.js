import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callAI } from '@/lib/ai';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // 1. Get the custom chatbot prompt and API key
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
    });

    const apiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
    }
    
    // Fallback if settings don't exist yet
    const systemPrompt = settings?.chatbotPrompt || "You are a helpful, friendly budtender at Elevated Dispensary. Recommend products from our inventory based on the user's needs. Be concise, polite, and use a chill tone.";

    // 2. Get current active inventory
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        stock: { gt: 0 }
      },
      select: {
        name: true,
        category: true,
        price: true,
        weight: true,
        description: true,
        featured: true
      }
    });

    const inventoryContext = `
Here is our current active inventory (JSON format):
${JSON.stringify(products)}

Only recommend products that are listed in the inventory above. Do not hallucinate products. Do not mention that you are an AI.
`;

    const openRouterMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n${inventoryContext}`
      },
      ...messages
    ];

    const data = await callAI(openRouterMessages, {
      model: settings.aiModel,
      openRouterApiKey: apiKey,
      linerApiKey: settings.linerApiKey || process.env.LINER_API_KEY
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
