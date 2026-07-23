import prisma from '@/lib/prisma';

async function callGroq(model, messages, apiKey) {
  if (!apiKey) throw new Error('Groq API Key is missing');
  const actualModel = model.replace('groq-', '');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: actualModel,
      messages: messages
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    const error = new Error(`Groq API error: ${res.status} ${errorText}`);
    error.status = res.status;
    throw error;
  }
  return await res.json();
}

import OpenAI from 'openai';

async function callAgentRouter(model, messages, apiKey) {
  if (!apiKey) throw new Error('AgentRouter API Key is missing');
  const actualModel = model.replace('agentrouter/', '');

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://agentrouter.org/v1',
    defaultHeaders: {
      'System-Access-Token': 'WA4ATB9r8lpvIZyAbAwDCteXwNc+lAY='
    }
  });

  const response = await openai.chat.completions.create({
    model: actualModel,
    messages: messages,
  });

  return response;
}

async function callOpenRouter(model, messages, apiKey) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    const error = new Error(`OpenRouter API error: ${res.status} ${errorText}`);
    error.status = res.status;
    throw error;
  }
  return await res.json();
}

export async function callAI(messages, options = {}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  
  const primaryModel = options.model || settings?.aiModel || "agentrouter/gpt-5.5";
  const openRouterApiKey = options.openRouterApiKey || settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const groqApiKey = options.groqApiKey || settings?.groqApiKey || process.env.GROQ_API_KEY;

  const agentRouterApiKey = options.agentRouterApiKey || settings?.agentRouterApiKey || process.env.AGENTROUTER_API_KEY;

  const isPrimaryGroq = primaryModel.startsWith('groq-');
  const isAgentRouter = primaryModel.startsWith('agentrouter/');
  
  try {
    // Attempt Primary Provider
    if (isPrimaryGroq) {
      return await callGroq(primaryModel, messages, groqApiKey);
    } else if (isAgentRouter) {
      return await callAgentRouter(primaryModel, messages, agentRouterApiKey);
    } else {
      return await callOpenRouter(primaryModel, messages, openRouterApiKey);
    }
  } catch (error) {
    // Check if it's a rate limit (429) or service unavailable (503) error
    const isRetryableError = error.status === 429 || error.status === 503 || error.message.toLowerCase().includes('rate limit');
    
    if (isRetryableError) {
      console.warn(`[AI Failover] Primary provider failed with ${error.status || 'rate limit'}. Attempting fallback...`);
      
      try {
        // Attempt Secondary Provider as Fallback
        if (isPrimaryGroq) {
          // Fallback to OpenRouter
          console.log('[AI Failover] Falling back to OpenRouter');
          return await callOpenRouter("openrouter/free", messages, openRouterApiKey);
        } else {
          // Fallback to Groq
          console.log('[AI Failover] Falling back to Groq');
          return await callGroq("groq-llama-3.1-8b-instant", messages, groqApiKey);
        }
      } catch (fallbackError) {
        console.error('[AI Failover] Fallback provider also failed:', fallbackError);
        throw new Error(`Primary Provider Error: ${error.message}. Fallback Provider Error: ${fallbackError.message}`); 
      }
    }
    
    // If it wasn't a rate limit/503, just throw the original error
    throw error;
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

export async function autoTagProduct(name, category, description) {
  const AVAILABLE_EFFECTS = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

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

  const data = await callAI(messages);
  let responseText = data.choices?.[0]?.message?.content?.trim() || '[]';
  
  if (responseText.startsWith('```json')) responseText = responseText.substring(7);
  else if (responseText.startsWith('```')) responseText = responseText.substring(3);
  if (responseText.endsWith('```')) responseText = responseText.substring(0, responseText.length - 3);
  
  responseText = responseText.trim();
  
  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed)) {
      return parsed.filter(effect => AVAILABLE_EFFECTS.includes(effect));
    }
  } catch (e) {
    console.error('Failed to parse AI response for effects:', responseText);
  }
  return [];
}
