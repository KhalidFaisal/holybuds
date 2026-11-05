import prisma from '@/lib/prisma';
import { generateCoverImage } from '@/lib/imageGenerator';

export const TRENDING_TOPICS = [
  // Category: Delivery & Lifestyle
  {
    topic: 'Long Island Same-Day Weed Delivery: How Holy Buds Delivers Top-Shelf Strains to Your Door',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Discreet Cannabis Etiquette: How to Store and Enjoy Weed in Suburban Long Island',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Weekend Wind-Down on Long Island: Late Night Delivery Hours Until Midnight',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Beach Vibes and Boardwalks: Safe and Responsible Summer Cannabis Use in NY',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Hosting a Cannabis Dinner Party: Pairing Strains with Gourmet Courses',
    category: 'Delivery & Lifestyle',
    defaultImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80'
  },

  // Category: Cannabis 101
  {
    topic: 'Indica vs. Sativa vs. Hybrid: The Real Difference and How Cannabinoids Shape Your Vibe',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Terpenes Explained: Why Myrcene, Limonene, and Caryophyllene Matter More Than THC',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'How to Read a Cannabis Certificate of Analysis (COA): Lab Testing 101',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'The Entourage Effect: How Cannabinoids, Terpenes, and Flavonoids Work in Harmony',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Anatomy of the Cannabis Trichome: Where Flavor and Potency Are Born',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Beginner Guide to Cannabis Pre-Rolls: Infused vs Standard Joints Explained',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Grinders, Papers, and Glass: The Essential Gear Every Connoisseur Needs',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=1200&q=80'
  },

  // Category: Strain Guides
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
    topic: 'Gelato, Runtz, and Cookies: Exploring the Sweet Terpene Revolution',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Sour Diesel Heritage: The Legendary East Coast Strain That Defined an Era',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'OG Kush Lineage: Deep Dive into the Backbone of West Coast and East Coast Gas',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Live Resin vs Cured Resin: Cartridge and Concentrate Buyer Guide',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Diamond Sauce and Badder: Understanding Concentrate Textures and Temperatures',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80'
  },

  // Category: Edibles & Dosing
  {
    topic: 'Cannabis Edibles Dosing Guide: From 5mg Microdose to 50mg Connoisseur Level',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Fast-Acting Nano Edibles: How Water-Soluble THC Delivers Effects in 15 Minutes',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis Chocolates vs Gummies: Digestion Rates and Experience Differences',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'What to Do If You Take Too Many Edibles: Simple Remedies to Ground Yourself',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis Beverages: The Modern Alternative to Alcohol for Social Evenings',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80'
  },

  // Category: Wellness
  {
    topic: 'Cannabis for Evening Wind-Down and Deep Sleep: Strains and Routines That Work',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'CBN and CBD for Rest: The Non-Intoxicating Cannabinoids Gaining Fame',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis and Post-Workout Recovery: Easing Muscle Soreness and Tension',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Mindful Consumption: Combining Microdosing with Meditation and Yoga',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Daytime Clarity: High-CBG and Pinene Strains for Productive Afternoon Focus',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
  },

  // Category: Travel & Laws (High National US Search Volume)
  {
    topic: 'Can You Bring Weed on Domestic US Flights? Official TSA Rules Explained',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'THCA vs Delta 9: The 2018 Farm Bill Legal Distinction Explained for Connoisseurs',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Traveling Across State Lines with Legal Cannabis: Federal Risk Breakdown',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Can Out-of-State Tourists Buy Cannabis in New York Legally?',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'State-by-State Cannabis Reciprocity: Where Out-of-State Medical Cards Are Honored',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Federal Rescheduling of Cannabis: What Moving to Schedule III Means for Consumers',
    category: 'Travel & Laws',
    defaultImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'
  },

  // High-Volume US National Consumer Intent Queries
  {
    topic: 'How Long Does Cannabis Stay in Your System? Urine, Blood, and Saliva Timelines',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Does Weed Go Bad? Shelf Life, Mold Signs, and Proper Storage Techniques',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'CBD to THC Ratios: How to Balance Anxiety and Euphoria for Beginners',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Can You Build a THC Tolerance Quickly? The Science of Cannabinoid Resensitization',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'The Ultimate Terpene Chart: Boiling Points, Aromas, and Targeted Effects',
    category: 'Cannabis 101',
    defaultImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Dry Herb Vaping vs Smoking: Temperature Guide, Terpene Preservation, and Lung Health',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Best Vaporizers for Hash Rosin and Wax: Portable vs Desktop Rigs',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Live Rosin vs Live Resin: What Makes Solventless Concentrates Worth the Premium?',
    category: 'Strain Guides',
    defaultImage: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'What to Do If You Took Too Many Edibles: Proven Techniques to Ground Yourself Fast',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'The 11-Hydroxy-THC Factor: Why Ingested Cannabis Feels Different from Inhaled Smoke',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis Decarboxylation 101: Exact Time and Temperatures for Potent Infusions',
    category: 'Edibles & Dosing',
    defaultImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80'
  },
  {
    topic: 'Cannabis and Sleep Architecture: How THC and CBN Affect REM Cycles',
    category: 'Wellness',
    defaultImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80'
  }
];

export const PRESEEDED_BLOGS = [
  {
    id: 'seed-post-1',
    slug: 'long-island-cannabis-delivery-guide',
    title: 'The Ultimate Guide to Long Island Cannabis Delivery: Fast, Discreet, and Reliable',
    excerpt: 'Everything you need to know about ordering top-shelf cannabis delivered directly to your doorstep across Long Island.',
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

Finding clean, high-grade cannabis on Long Island has never been easier. Gone are the days of sketchy meetups or driving out of your way to upstate dispensaries. With Holy Buds, premium cannabis products are delivered straight to your residence across Long Island.

### How Our Direct Delivery Works

1. **Browse the Menu**: Explore curated flower, concentrates, gourmet edibles, and potent vapes on our digital storefront.
2. **Select Your Address & Contact**: Enter your local delivery address and mobile number.
3. **Real-Time Driver Tracking**: Once your order is dispatched, our local drivers notify you so you are always updated.
4. **Convenient Payment**: Complete payment seamlessly upon delivery via cash or instant transfer.

### Weekend Extended Hours

We understand that Friday and Saturday nights require flexibility. Holy Buds operates extended delivery and pickup hours on weekends until midnight (12:00 AM), ensuring you never get caught without your favorite strains when friends come over.

### Why Quality Matters

All items on Holy Buds are sourced from licensed cultivators who test for potency, purity, heavy metals, and residual pesticides. When you order from us, you get clean burns, pure aromas, and consistent effects.

Ready to test the experience? Visit our menu to place your next delivery order today.

## Frequently Asked Questions

### How fast is weed delivery on Long Island?
Holy Buds provides same-day delivery across Nassau and Suffolk counties. Typical delivery windows range between 45 and 90 minutes from dispatch, with real-time tracking updates provided.

### Do I need a medical marijuana card to order?
No. In New York State, adults aged 21 and older with valid government-issued identification can legally purchase adult-use recreational cannabis products for delivery.

### What are Holy Buds weekend operating hours?
Holy Buds delivers extended weekend hours on Friday and Saturday nights until 12:00 AM midnight, ensuring access to curated top-shelf cannabis when you need it.`
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

When browsing our live menu, look beyond THC percentages. Check the dominant terpene profile and customer reviews to find the exact sensation you desire, whether that is energetic creativity or peaceful slumber.

## Frequently Asked Questions

### What is the main difference between Indica and Sativa?
While traditionally Sativas are considered energizing and Indicas sedating, modern cannabis science proves that cannabinoid ratios and terpene profiles like myrcene versus limonene determine the actual psychoactive and physical effects.

### What is the Entourage Effect?
The Entourage Effect describes how cannabinoids like THC, CBD, and CBG together with aromatic terpenes work synergistically to produce a richer, more balanced experience than isolated THC compounds.

### Can a Hybrid strain lean more toward energy or sleep?
Yes. Hybrids are categorized as Sativa-dominant (uplifting), Indica-dominant (relaxing), or balanced (50/50), allowing consumers to tailor their vibe based on specific needs and times of day.`
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

Explore our artisanal gummies, chocolates, and specialty edibles on our storefront.

## Frequently Asked Questions

### How long does it take for cannabis edibles to kick in?
Edibles typically take between 45 and 120 minutes to take effect because the cannabinoids must be processed through your digestive system and metabolized by your liver into 11-hydroxy-THC.

### What is a recommended starting dose for beginners?
First-time consumers should start with a low dose of 2.5mg to 5mg of THC. Wait at least two full hours before considering taking any additional amount.

### What should I do if I accidentally consume too much THC in an edible?
Stay calm and remember that the sensation is temporary. Drink fresh water, ingest black peppercorns rich in calming caryophyllene, consider non-intoxicating CBD, and rest in a comfortable quiet space.`
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
 * Generate a new blog post using the Neodymium API with anti-duplication
 */
export async function generateBlogPost({ topic, category } = {}) {
  const apiKey = await getNeodymiumApiKey();

  if (!apiKey) {
    throw new Error('Neodymium API Key is not configured. Please add it in the Admin Dashboard or set NEODYMIUM_API_KEY.');
  }

  // 1. Fetch existing article titles from database to prevent duplicate content
  let existingTitles = [];
  try {
    if (prisma && prisma.blogPost) {
      const existing = await prisma.blogPost.findMany({
        select: { title: true, slug: true, category: true },
        take: 100,
        orderBy: { createdAt: 'desc' }
      });
      existingTitles = existing.map(e => e.title);
    }
  } catch (err) {
    console.warn('Could not query existing posts to deduplicate:', err.message);
  }

  // 2. Select topic if not explicitly provided
  let selectedTopic = topic;
  let selectedCategory = category;
  let defaultCover = 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1200&q=80';

  if (!selectedTopic) {
    // Filter out topics already written
    const unwrittenTopics = TRENDING_TOPICS.filter((t) => {
      const topicLower = (t.topic || '').toLowerCase();
      return !existingTitles.some((titleStr) => {
        if (!titleStr || typeof titleStr !== 'string') return false;
        const existingLower = titleStr.toLowerCase();
        return (
          existingLower.includes(topicLower.slice(0, 25)) ||
          topicLower.includes(existingLower.slice(0, 25))
        );
      });
    });

    const pool = unwrittenTopics.length > 0 ? unwrittenTopics : TRENDING_TOPICS;
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    selectedTopic = randomItem.topic;
    selectedCategory = selectedCategory || randomItem.category;
    defaultCover = randomItem.defaultImage;
  }

  // Build exclusion list for system prompt
  const exclusionText = existingTitles.length > 0
    ? `\n\nALREADY PUBLISHED ARTICLES (DO NOT DUPLICATE THESE OR WRITE SIMILAR TITLES):\n${existingTitles.slice(0, 25).map(t => `- ${t}`).join('\n')}\nPick a fresh, unique angle or new subject that has NOT been covered above.`
    : '';

  const systemPrompt = `You are a master cannabis educator and senior copywriter writing for Holy Buds, Long Island's premier dispensary and delivery brand.
Your tone is knowledgeable, welcoming, sophisticated, and engaging.

CRITICAL RULES:
1. DO NOT include any emojis anywhere in your response.
2. Return ONLY a single valid raw JSON object without any backticks, markdown code blocks, or text outside the JSON.
3. The JSON must match this exact structure:
{
  "title": "Clear and compelling article headline",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "A concise 2-sentence summary hook (under 160 characters)",
  "category": "Cannabis 101" | "Strain Guides" | "Edibles & Dosing" | "Delivery & Lifestyle" | "Wellness" | "Travel & Laws",
  "imagePrompt": "A vivid editorial photography prompt describing a luxury cannabis scene for this article. Focus on natural botanical textures, macro trichomes, amber glass jars, warm cinematic lighting, and clean minimalist composition. Strictly no text, no letters, no logos, no watermarks, no emojis.",
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
- Mention visiting /menu to browse curated lab-tested products.
- MANDATORY FAQ SECTION: End every article with a dedicated '## Frequently Asked Questions' section containing 3 to 4 high-intent questions (formatted as ### Question?) with direct, comprehensive answers (2 to 4 sentences each). This structure directly earns Google Position Zero FAQ rich snippets.${exclusionText}`;

  const userPrompt = `Write an in-depth, authoritative, and engaging educational blog post about: "${selectedTopic}".
Category: ${selectedCategory || 'Cannabis 101'}.
Ensure the content is well-structured with clear markdown headings, completely unique from existing articles, and contains zero emojis.`;

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
      temperature: 0.75
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

  // Generate unique cover image via /v1/images/generations with fallback
  let generatedCover = null;
  try {
    generatedCover = await generateCoverImage({
      prompt: parsed.imagePrompt,
      title,
      category: categoryFinal,
      slug
    });
  } catch (imgErr) {
    console.warn('[BlogGenerator] AI cover image generation error:', imgErr.message);
  }

  const finalCoverImage = generatedCover || parsed.coverImage || defaultCover;

  return {
    title,
    slug,
    excerpt,
    content,
    category: categoryFinal,
    tags: JSON.stringify(tags),
    coverImage: finalCoverImage,
    readTime,
    author: 'Holy Buds Editorial',
    published: true,
    views: 0,
    seoTitle,
    seoDescription
  };
}
