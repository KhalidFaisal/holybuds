import prisma from '@/lib/prisma';

export const TRENDING_TOPICS = [
  {
    topic: 'Long Island Same-Day Weed Delivery: How Holy Buds Delivers Top-Shelf Strains to Your Door',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Indica vs. Sativa vs. Hybrid: The Real Difference and How Cannabinoids Shape Your Vibe',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis Edibles Dosing Guide: From 5mg Microdose to 50mg Connoisseur Level',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Terpenes Explained: Why Myrcene, Limonene, and Caryophyllene Matter More Than THC',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'THCA Flower Demystified: Potency, Legality, and How It Transforms When Heated',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'The Rise of Live Rosin: Why Solventless Cannabis Concentrates Rule the Market',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis for Evening Wind-Down and Deep Sleep: Strains and Routines That Work',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Beginner Guide to Cannabis Pre-Rolls: Infused vs Standard Joints Explained',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1200&q=80'
  }
];

export const PRESEEDED_BLOGS = [
  {
    id: 'seed-post-1',
    slug: 'long-island-cannabis-delivery-guide',
    title: 'The Ultimate Guide to Long Island Cannabis Delivery: Fast, Discreet, and Reliable',
    excerpt: 'Everything you need to know about ordering top-shelf cannabis delivered directly to your doorstep across Nassau and Suffolk counties.',
    category: 'Delivery & Lifestyle',
    tags: JSON.stringify(['Long Island', 'Delivery', 'Cannabis Guide', 'Holy Buds']),
    coverImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    readTime: '5 min read',
    author: 'Holy Buds Dispatch',
    published: true,
    views: 342,
    seoTitle: 'Long Island Cannabis Delivery Guide | Holy Buds',
    seoDescription: 'Fast, discreet weed delivery across Long Island, NY. Learn how Holy Buds brings curated flowers, edibles, and vapes to your door.',
    createdAt: new Date('2026-10-25T14:00:00Z'),
    updatedAt: new Date('2026-10-25T14:00:00Z'),
    content: `## Quick, Discreet, and Hassle-Free Long Island Delivery

Finding clean, high-grade cannabis on Long Island has never been easier. Gone are the days of sketchy meetups or driving out of your way to upstate dispensaries. With Holy Buds, premium cannabis products are delivered straight to your residence across Nassau and Suffolk counties.

### How Our Direct Delivery Works

1. **Browse the Menu**: Explore curated flower, concentrates, gourmet edibles, and potent vapes on our digital storefront.
2. **Select Your Address & Contact**: Enter your local delivery address and mobile number.
3. **Real-Time Driver Tracking**: Once your order is dispatched, our local drivers notify you so you are always updated.
4. **Convenient Payment**: Complete payment seamlessly upon delivery via cash or instant transfer.

### Weekend Extended Hours

We understand that Friday and Saturday nights require flexibility. Holy Buds operates extended delivery and pickup hours on weekends until midnight (12:00 AM), ensuring you never get caught without your favorite strains when friends come over.

### Why Quality Matters

All items on Holy Buds are sourced from licensed cultivators who test for potency, purity, heavy metals, and residual pesticides. When you order from us, you get clean burns, pure aromas, and consistent effects.

Ready to test the experience? Visit our menu to place your next delivery order today.`
  },
  {
    id: 'seed-post-2',
    slug: 'indica-vs-sativa-vs-hybrid-breakdown',
    title: 'Indica vs. Sativa vs. Hybrid: How Cannabinoids and Terpenes Shape Your Experience',
    excerpt: 'Demystifying the classic cannabis debate. Understand why terpenes and full-spectrum cannabinoid profiles matter more than traditional plant labels.',
    category: 'Cannabis 101',
    tags: JSON.stringify(['Indica', 'Sativa', 'Hybrid', 'Cannabinoids', 'Education']),
    coverImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80',
    readTime: '6 min read',
    author: 'Holy Buds Budtenders',
    published: true,
    views: 512,
    seoTitle: 'Indica vs Sativa vs Hybrid Guide | Holy Buds Education',
    seoDescription: 'Unpack the differences between Indica, Sativa, and Hybrid strains. Discover how terpenes dictate euphoria, focus, and physical relaxation.',
    createdAt: new Date('2026-10-20T10:30:00Z'),
    updatedAt: new Date('2026-10-20T10:30:00Z'),
    content: `## Beyond the Common Myth of Indica and Sativa

For decades, dispensary shoppers were told a simple binary story: Sativa provides an energetic head high, while Indica delivers heavy couch-lock body relaxation. While useful as a starting point, modern cannabis science reveals that the truth is much richer and more nuanced.

### The Role of Plant Morphology

Originally, botanical terms described how the plant grew:
- **Cannabis Sativa**: Tall, narrow leaves, long flowering cycles, native to warm equatorial regions.
- **Cannabis Indica**: Short, bushy stature, broad leaves, faster flowering, native to mountainous Central Asian climates.

These physical traits do not dictate the psychoactive effects on their own. Instead, the combination of cannabinoids and aromatic compounds called terpenes creates the distinct experience known as the **Entourage Effect**.

### Key Terpenes to Look For

- **Myrcene**: Earthy, herbal aroma. High concentrations of myrcene are the primary reason certain strains induce profound physical calmness.
- **Limonene**: Citrus-forward, sharp aroma. Associated with elevated mood, mental alertness, and daytime clarity.
- **Caryophyllene**: Spicy, peppery notes. The only known terpene that also binds directly to CB2 receptors in the human body, providing anti-inflammatory relief.
- **Linalool**: Floral, lavender aroma. Excellent for soothing stress after intense workdays.

### Finding Your Ideal Match

When browsing our live menu, look beyond THC percentages. Check the dominant terpene profile and customer reviews to find the exact sensation you desire, whether that is energetic creativity or peaceful slumber.`
  },
  {
    id: 'seed-post-3',
    slug: 'cannabis-edibles-dosing-guide',
    title: 'Cannabis Edibles Dosing Guide: How to Dose for a Predictable, Smooth High',
    excerpt: 'Master the art of cannabis edibles. Learn about 11-hydroxy-THC metabolism, onset timing, and the golden rules of microdosing.',
    category: 'Edibles & Dosing',
    tags: JSON.stringify(['Edibles', 'Gummies', 'Dosing Guide', 'Beginner']),
    coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    readTime: '4 min read',
    author: 'Holy Buds Team',
    published: true,
    views: 429,
    seoTitle: 'Cannabis Edibles Dosing Guide | Holy Buds',
    seoDescription: 'Master the art of cannabis edibles dosing. Tips on onset time, milligram recommendations, and avoiding accidental overconsumption.',
    createdAt: new Date('2026-10-15T09:15:00Z'),
    updatedAt: new Date('2026-10-15T09:15:00Z'),
    content: `## Why Edibles Hit Differently

When you inhale cannabis smoke or vapor, delta-9-THC enters your bloodstream directly through the lungs, with effects peaking in 10 to 15 minutes. 

With edibles, THC travels through your digestive system into your liver, where it converts into **11-hydroxy-THC**. This metabolite is significantly more potent and crosses the blood-brain barrier with ease, creating a deeper, longer-lasting body experience.

### Standard Dosage Tiers

- **Microdose (1mg - 2.5mg THC)**: Subtle relief from tension, mild focus, zero intoxication. Ideal for daytime productivity.
- **Low Dose (5mg THC)**: The gold standard for social outings, movie nights, or beginner relaxation.
- **Moderate Dose (10mg - 15mg THC)**: Noticeable euphoria, altered perception, strong physical relaxation.
- **Experienced Dose (20mg - 50mg THC)**: Heavy body effects, significant euphoria, ideal for high-tolerance consumers or sleep aid.

### The Golden Rules of Edibles

1. **Patience is Key**: Edibles can take between 45 and 120 minutes to manifest depending on your stomach contents and metabolism. Never take a second dose before two full hours have passed.
2. **Eat Something First**: Consuming edibles with a small snack containing healthy fats helps your digestive system absorb cannabinoids more evenly.
3. **Stay Hydrated**: Keep fresh water nearby to keep dry mouth at bay.

Explore our artisanal gummies, chocolates, and specialty edibles on our storefront.`
  }
];

// Helper to remove any emojis from text to adhere strictly to rules
function sanitizeNoEmojis(str) {
  if (!str) return '';
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '').trim();
}

// Convert string into URL slug
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Resolves the Neodymium API key from siteSettings or environment
 */
export async function getNeodymiumApiKey() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (settings?.neodymiumApiKey && settings.neodymiumApiKey.trim() !== '') {
      return settings.neodymiumApiKey.trim();
    }
  } catch (err) {
    console.warn('Could not read siteSettings for neodymiumApiKey:', err.message);
  }
  return process.env.NEODYMIUM_API_KEY || null;
}

/**
 * Generate a new blog post using the Neodymium API
 */
export async function generateBlogPost({ topic, category } = {}) {
  const apiKey = await getNeodymiumApiKey();

  if (!apiKey) {
    throw new Error('Neodymium API Key is not configured. Please add it in the Admin Dashboard or set NEODYMIUM_API_KEY.');
  }

  // Select topic if not provided
  let selectedTopic = topic;
  let selectedCategory = category;
  let defaultCover = 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80';

  if (!selectedTopic) {
    const randomItem = TRENDING_TOPICS[Math.floor(Math.random() * TRENDING_TOPICS.length)];
    selectedTopic = randomItem.topic;
    selectedCategory = selectedCategory || randomItem.category;
    defaultCover = randomItem.defaultImage;
  }

  const systemPrompt = `You are a professional cannabis copywriter, educator, and master budtender writing for Holy Buds, Long Island's premier cannabis brand and delivery service.
Your tone is knowledgeable, welcoming, sophisticated, and engaging.

CRITICAL RULES:
1. DO NOT include any emojis anywhere in your response.
2. Return ONLY a single valid raw JSON object without any backticks, markdown code blocks, or text outside the JSON.
3. The JSON must match this exact structure:
{
  "title": "Clear and compelling article headline",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "A concise 2-sentence summary hook (under 160 characters)",
  "category": "Cannabis 101" | "Strain Guides" | "Edibles & Dosing" | "Delivery & Lifestyle" | "Wellness",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "readTime": "5 min read",
  "content": "Rich markdown formatted article body with ## and ### headings, informative paragraphs, bullet points, pro tips, and an invitation to check out the Holy Buds menu at /menu",
  "seoTitle": "SEO title under 60 characters | Holy Buds",
  "seoDescription": "Meta description under 155 characters summarizing the article for Google."
}

Article Content Guidelines:
- Length: Minimum 700 to 1200 words.
- Format: Clean Markdown with multiple H2 (##) and H3 (###) sections.
- Incorporate subtle mentions of Holy Buds discreet delivery across Long Island, NY, and operating hours until midnight on weekends.
- Mention visiting /menu to browse curated lab-tested products.`;

  const userPrompt = `Write an in-depth, authoritative, and engaging educational blog post about: "${selectedTopic}".
Category: ${selectedCategory || 'Cannabis 101'}.
Ensure the content is well-structured with clear markdown headings and zero emojis.`;

  const response = await fetch('https://api.neodymium.app/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Neodymium API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  // Clean code fences if any
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr) {
    console.error('Failed to parse AI JSON:', rawText);
    throw new Error('Failed to parse blog post output from Neodymium AI. Please try again.');
  }

  const title = sanitizeNoEmojis(parsed.title || selectedTopic);
  const slug = slugify(parsed.slug || title) + '-' + Math.floor(1000 + Math.random() * 9000);
  const excerpt = sanitizeNoEmojis(parsed.excerpt || '');
  const content = sanitizeNoEmojis(parsed.content || '');
  const categoryFinal = sanitizeNoEmojis(parsed.category || selectedCategory || 'Cannabis 101');
  const tags = Array.isArray(parsed.tags) ? parsed.tags.map(sanitizeNoEmojis) : ['Cannabis', 'Holy Buds'];
  const readTime = parsed.readTime || '5 min read';
  const seoTitle = sanitizeNoEmojis(parsed.seoTitle || `${title} | Holy Buds`);
  const seoDescription = sanitizeNoEmojis(parsed.seoDescription || excerpt);

  return {
    title,
    slug,
    excerpt,
    content,
    category: categoryFinal,
    tags: JSON.stringify(tags),
    coverImage: parsed.coverImage || defaultCover,
    readTime,
    author: 'Holy Buds Editorial',
    published: true,
    views: 0,
    seoTitle,
    seoDescription
  };
}

