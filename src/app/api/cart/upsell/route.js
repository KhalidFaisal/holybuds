import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callAI } from '@/lib/ai';

export async function POST(request) {
  try {
    const { cartItems } = await request.json();

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'cartItems array is required' }, { status: 400 });
    }

    if (cartItems.length === 0) {
      return NextResponse.json({ recommendation: null });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    const apiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const linerApiKey = settings?.linerApiKey || process.env.LINER_API_KEY;

    if (!apiKey && !linerApiKey) {
      return NextResponse.json({ error: 'AI API Key is not configured' }, { status: 500 });
    }

    // 1. Get current active inventory
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
        weight: true,
      }
    });

    const inventoryContext = `
Here is our current active inventory (JSON format):
${JSON.stringify(products)}
`;

    const cartContext = `
The customer currently has these items in their cart:
${JSON.stringify(cartItems)}
`;

    const systemPrompt = `You are an expert cannabis retail up-seller. Based on the customer's cart, recommend exactly ONE product from the inventory that complements their purchase. 
Return the response as a pure JSON object with a single key "recommendedProductId" containing the ID of the product you recommend. Do not include any markdown, quotes, or conversational text. Just the JSON object.
If nothing fits well, or the cart is empty, return {"recommendedProductId": null}.`;

    let data;
    try {
      data = await callAI([
        { role: "system", content: systemPrompt + '\n' + inventoryContext },
        { role: "user", content: cartContext }
      ], {
        model: settings.aiModel,
        openRouterApiKey: apiKey,
        linerApiKey: linerApiKey
      });
    } catch (e) {
      console.error('AI Upsell error:', e);
      return NextResponse.json({ error: 'Failed to generate upsell' }, { status: 500 });
    }
    const content = data.choices?.[0]?.message?.content;
    
    try {
      // The AI might occasionally wrap the response in markdown code blocks even with response_format
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedContent);
      
      if (result.recommendedProductId) {
        // Fetch full product details for the recommendation
        const recommendedProduct = await prisma.product.findUnique({
          where: { id: result.recommendedProductId }
        });
        
        // Ensure they aren't recommending something already in the cart
        const inCart = cartItems.some(item => item.id === result.recommendedProductId);
        
        if (recommendedProduct && !inCart) {
          return NextResponse.json({ recommendation: recommendedProduct });
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI upsell response:', content);
    }
    
    return NextResponse.json({ recommendation: null });

  } catch (error) {
    console.error('Upsell API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
