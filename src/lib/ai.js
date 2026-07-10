import prisma from '@/lib/prisma';

export async function callAI(messages, options = {}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  
  const model = options.model || settings?.aiModel || "openrouter/free";
  const openRouterApiKey = options.openRouterApiKey || settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const linerApiKey = options.linerApiKey || settings?.linerApiKey || process.env.LINER_API_KEY;

  if (model === 'liner-ai') {
    if (!linerApiKey) {
      throw new Error('Liner API Key is missing');
    }

    const res = await fetch('https://platform.liner.com/api/v1/agents/quick-answer', {
      method: 'POST',
      headers: {
        'x-api-key': linerApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Liner API error:', errorText);
      throw new Error('Failed to communicate with Liner AI');
    }

    // Process SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'text-delta' && parsed.delta) {
              fullText += parsed.delta;
            }
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }

    return {
      choices: [
        {
          message: {
            content: fullText
          }
        }
      ]
    };
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
