import prisma from '@/lib/prisma';

export const GROQ_MODELS = [
  'groq/compound',
  'openai/gpt-oss-120b',
  'groq/compound-mini',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-20b'
];

async function callGroq(model, messages, apiKey) {
  if (!apiKey) throw new Error('Groq API Key is missing');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    const error = new Error(`Groq API error: ${res.status} ${errorText}`);
    error.status = res.status;
    throw error;
  }
  return await res.json();
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
  
  const primaryModel = options.model || settings?.aiModel || "groq";
  const openRouterApiKey = options.openRouterApiKey || settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const groqApiKey = options.groqApiKey || settings?.groqApiKey || process.env.GROQ_API_KEY;
  
  const groqEnabled = settings?.groqEnabled ?? true;
  const openRouterEnabled = settings?.openRouterEnabled ?? true;
  
  let enabledGroqModels = GROQ_MODELS;
  if (settings?.enabledGroqModels) {
    try {
      enabledGroqModels = JSON.parse(settings.enabledGroqModels);
    } catch (e) {}
  }

  const isPrimaryGroq = primaryModel.toLowerCase() === 'groq' || GROQ_MODELS.includes(primaryModel);
  
  if (!groqEnabled && !openRouterEnabled) {
    throw new Error('All AI providers are disabled in settings.');
  }

  // Helper to try all enabled Groq models
  const tryGroqModels = async () => {
    if (!groqEnabled || enabledGroqModels.length === 0) {
      throw new Error('Groq is disabled or no models are enabled.');
    }
    
    // Shuffle models to randomly distribute load
    const modelsToTry = [...enabledGroqModels].sort(() => Math.random() - 0.5);
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log(`[AI] Attempting Groq model: ${model}`);
        return await callGroq(model, messages, groqApiKey);
      } catch (error) {
        lastError = error;
        const isRetryable = error.status === 429 || error.status === 503 || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('overloaded');
        if (isRetryable) {
          console.warn(`[AI Failover] Groq model ${model} failed. Trying next...`);
          continue; // Try next Groq model
        } else {
          // If it's a fatal error (like invalid API key), stop trying Groq
          throw error;
        }
      }
    }
    // If we exhausted all Groq models
    throw lastError || new Error('All Groq models failed.');
  };

  // Helper to try OpenRouter
  const tryOpenRouter = async () => {
    if (!openRouterEnabled) throw new Error('OpenRouter is disabled.');
    const actualModel = primaryModel.toLowerCase() === 'openrouter' ? 'openrouter/free' : primaryModel;
    return await callOpenRouter(actualModel, messages, openRouterApiKey);
  };

  try {
    // Attempt Primary Provider
    if (isPrimaryGroq) {
      return await tryGroqModels();
    } else {
      return await tryOpenRouter();
    }
  } catch (error) {
    console.warn(`[AI Failover] Primary provider failed: ${error.message}. Attempting fallback provider...`);
    
    try {
      // Attempt Secondary Provider as Fallback
      if (isPrimaryGroq) {
        // Fallback to OpenRouter
        console.log('[AI Failover] Falling back to OpenRouter');
        return await tryOpenRouter();
      } else {
        // Fallback to Groq
        console.log('[AI Failover] Falling back to Groq');
        return await tryGroqModels();
      }
    } catch (fallbackError) {
      console.error('[AI Failover] Fallback provider also failed:', fallbackError.message);
      throw new Error(`Primary and Fallback Providers failed.`);
    }
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
