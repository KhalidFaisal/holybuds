import prisma from '@/lib/prisma';

export async function callAI(messages, options = {}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  
  const model = options.model || settings?.aiModel || "openrouter/free";
  const openRouterApiKey = options.openRouterApiKey || settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const groqApiKey = options.groqApiKey || settings?.groqApiKey || process.env.GROQ_API_KEY;

  if (model.startsWith('groq-')) {
    if (!groqApiKey) {
      throw new Error('Groq API Key is missing');
    }

    const actualModel = model.replace('groq-', '');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: actualModel,
        messages: messages
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Failed to communicate with Groq: ${res.status} ${errorText}`);
    }

    return await res.json();
  } else {
    // OpenRouter handling
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is missing');
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error('Failed to communicate with OpenRouter');
    }

    return await res.json();
  }
}

export async function generateProductDescription(name, category, weight) {
  let prompt = `Product Name: ${name}\nCategory: ${category}`;
  if (weight) prompt += `\nWeight/Size: ${weight}`;

  const messages = [
    {
      role: "system",
      content: "You are an expert cannabis copywriter. Write a catchy, engaging 2-3 sentence product description for a dispensary menu. Focus on quality, effects, and appeal. Do not use quotes around the output, just return the description text directly."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  const data = await callAI(messages);
  const description = data.choices?.[0]?.message?.content?.trim() || '';
  
  return description.replace(/^["']|["']$/g, ''); // strip leading/trailing quotes
}
