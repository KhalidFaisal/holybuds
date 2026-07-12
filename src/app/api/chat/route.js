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

    const openRouterApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const groqApiKey = settings?.groqApiKey || process.env.GROQ_API_KEY;
    
    if (!openRouterApiKey && !groqApiKey) {
      return NextResponse.json({ error: 'AI API Key is not configured' }, { status: 500 });
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

    let formattedMessages = [...messages];
    
    // Groq's Llama models strictly require the conversation to start with a 'user' message 
    // after the 'system' message. If the first message is from the assistant (the hardcoded greeting),
    // we prepend a dummy user message to satisfy the API.
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
      formattedMessages.unshift({ role: 'user', content: 'Hello' });
    }

    const openRouterMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n${inventoryContext}`
      },
      ...formattedMessages
    ];

    const data = await callAI(openRouterMessages, {
      model: settings.aiModel,
      openRouterApiKey: openRouterApiKey,
      groqApiKey: groqApiKey
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
