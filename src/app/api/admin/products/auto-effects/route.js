import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { requireAdmin } from '@/lib/auth';

const AVAILABLE_EFFECTS = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, category } = await request.json();

    if (!name && !description) {
      return NextResponse.json({ error: 'Name or description required' }, { status: 400 });
    }

    const messages = [
      {
        role: "user",
        content: `You are an expert cannabis sommelier. Given the following product information, determine which of these exact effects apply: ${AVAILABLE_EFFECTS.join(', ')}.

Return ONLY a raw JSON array of strings containing the applicable effects. Do not return any other text, markdown formatting, or explanations. If none apply, return [].

Product Name: ${name || 'Unknown'}
Category: ${category || 'Unknown'}
Description: ${description || 'No description provided.'}`
      }
    ];

    const aiResponse = await callAI(messages);
    
    // Parse the response
    let responseText = aiResponse.choices[0].message.content.trim();
    
    // Clean up markdown code blocks if the AI ignored the instruction
    if (responseText.startsWith('```json')) {
      responseText = responseText.substring(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.substring(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.substring(0, responseText.length - 3);
    }
    
    responseText = responseText.trim();
    
    let effects = [];
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        // Filter out any hallucinated effects not in our list
        effects = parsed.filter(effect => AVAILABLE_EFFECTS.includes(effect));
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ effects });

  } catch (error) {
    console.error('Auto-effects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
