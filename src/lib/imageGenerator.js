import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

/**
 * Resolves the API key for image generation from SiteSettings or environment variables
 */
export async function getImageApiKey() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (settings?.neodymiumApiKey && settings.neodymiumApiKey.trim() !== '') {
      return settings.neodymiumApiKey.trim();
    }
  } catch (err) {
    console.warn('[ImageGen] Could not query siteSettings for apiKey:', err.message);
  }

  return (
    process.env.IMAGE_GENERATION_API_KEY ||
    process.env.NEODYMIUM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    null
  );
}

/**
 * Constructs an editorial photography prompt tailored to cannabis topics
 * Designed to avoid false-positive content filters while yielding luxury visuals
 */
export function buildCoverImagePrompt({ title, category } = {}) {
  const cleanTitle = (title || 'Premium Cannabis Education')
    .replace(/[^\w\s-]/g, '')
    .trim();

  const categoryThemes = {
    'Cannabis 101': 'botanical close-up of lush cannabis trichomes, frosted emerald green foliage, laboratory magnifying glass, clean aesthetic',
    'Strain Guides': 'cured exotic cannabis flower buds in a luxury crystal jar, vibrant amber pistils, frosted resin, dark slate background',
    'Edibles & Dosing': 'artisanal fruit pectin cannabis gummies on a polished marble slab, natural herbal ingredients, gourmet kitchen setting',
    'Delivery & Lifestyle': 'sleek matte black dispensary packaging bag, organic green leaf sprig, modern minimalist coffee table, bright natural morning sunlight',
    'Wellness': 'amber tincture bottle with glass dropper, natural wooden surface, fresh eucalyptus and botanical herbs, calming zen atmosphere'
  };

  const themeDescriptor = categoryThemes[category] || 'curated botanical herbs, frosted trichome macro details, luxury dispensary aesthetic';

  return `Editorial commercial photography inspired by "${cleanTitle}". Visual scene: ${themeDescriptor}. Warm cinematic lighting, shallow depth of field, 8k resolution, minimalist composition, rich natural tones. Strictly no text, no letters, no logos, no watermarks, no digital graphics.`;
}

/**
 * Generates an image via the OpenAI-compatible /v1/images/generations endpoint
 * Optionally persists to Vercel Blob storage if BLOB_READ_WRITE_TOKEN is configured
 */
export async function generateCoverImage({ prompt, title, category, slug } = {}) {
  try {
    const apiKey = await getImageApiKey();
    if (!apiKey) {
      console.warn('[ImageGen] No API key available for image generation. Skipping.');
      return null;
    }

    const baseUrl = (
      process.env.IMAGE_GENERATION_BASE_URL ||
      process.env.NEODYMIUM_API_BASE ||
      'https://api.neodymium.app/v1'
    ).replace(/\/+$/, '');

    const finalPrompt = prompt && prompt.trim().length > 10
      ? prompt.trim()
      : buildCoverImagePrompt({ title, category });

    const endpoint = `${baseUrl}/images/generations`;

    console.log(`[ImageGen] Requesting cover image generation from ${endpoint}...`);

    const requestBody = {
      prompt: finalPrompt,
      model: process.env.IMAGE_GENERATION_MODEL || 'auto',
      n: 1,
      size: '1024x1024'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[ImageGen] API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const item = data?.data?.[0];
    const rawUrl = item?.url;
    const b64 = item?.b64_json;

    if (!rawUrl && !b64) {
      console.warn('[ImageGen] Response did not contain image url or b64_json.');
      return null;
    }

    // Persist to Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        let buffer = null;

        if (b64) {
          buffer = Buffer.from(b64, 'base64');
        } else if (rawUrl) {
          const downloadRes = await fetch(rawUrl);
          if (downloadRes.ok) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          }
        }

        if (buffer && buffer.length > 0) {
          const safeSlug = (slug || 'cover')
            .replace(/[^a-z0-9_-]/gi, '')
            .toLowerCase()
            .slice(0, 40);
          const filename = `blog/covers/${safeSlug}-${Date.now()}.png`;

          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'image/png'
          });

          if (blob?.url) {
            console.log('[ImageGen] Successfully saved cover image to Vercel Blob:', blob.url);
            return blob.url;
          }
        }
      } catch (blobErr) {
        console.warn('[ImageGen] Failed to persist image to Vercel Blob, using direct URL:', blobErr.message);
      }
    }

    // Direct fallback (Gateway URL or base64 data URI)
    if (rawUrl) {
      return rawUrl;
    }

    if (b64) {
      return `data:image/png;base64,${b64}`;
    }

    return null;
  } catch (error) {
    console.error('[ImageGen] Unexpected error during image generation:', error.message);
    return null;
  }
}

