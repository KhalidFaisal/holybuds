import prisma from '@/lib/prisma';

export async function generateProductDescription(name, category, weight) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  const model = settings?.aiModel || "openrouter/free";
  const apiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  let prompt = `Product Name: ${name}\nCategory: ${category}`;
  if (weight) prompt += `\nWeight/Size: ${weight}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are an expert cannabis copywriter. Write a catchy, engaging 2-3 sentence product description for a dispensary menu. Focus on quality, effects, and appeal. Do not use quotes around the output, just return the description text directly."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('OpenRouter API error:', errorText);
    throw new Error('Failed to generate description from AI');
  }

  const data = await res.json();
  const description = data.choices?.[0]?.message?.content?.trim() || '';
  
  return description.replace(/^["']|["']$/g, ''); // strip leading/trailing quotes if they included them anyway
}
