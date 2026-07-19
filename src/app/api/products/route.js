import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withProductDiscounts } from '@/lib/discounts';
import { requireAdmin } from '@/lib/auth';
import { generateProductDescription, autoTagProduct } from '@/lib/ai';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where = {};

    if (category && category !== 'ALL') where.category = category;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const enrichedProducts = await withProductDiscounts(products);

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    let imagesArr = [];
    if (Array.isArray(data.images)) {
      imagesArr = data.images;
    } else if (data.image) {
      imagesArr = [data.image];
    }
    const primaryImage = imagesArr.length > 0 ? imagesArr[0] : '';

    let finalDescription = data.description || '';
    if (!finalDescription && data.name && data.category) {
      try {
        finalDescription = await generateProductDescription(data.name, data.category, data.weight);
      } catch (err) {
        console.error('Failed to auto-generate description:', err);
      }
    }

    let finalEffectsStr = data.effects || '[]';
    try {
      const parsed = JSON.parse(finalEffectsStr);
      // Auto tag if it's a FLOWER and no effects were provided
      if (data.category === 'FLOWER' && parsed.length === 0 && (data.name || finalDescription)) {
        const generatedEffects = await autoTagProduct(data.name, data.category, finalDescription);
        finalEffectsStr = JSON.stringify(generatedEffects);
      }
    } catch (err) {
      console.error('Failed to auto-tag effects:', err);
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        price: parseFloat(data.price),
        weight: data.weight || null,
        description: finalDescription,
        image: primaryImage,
        images: JSON.stringify(imagesArr),
        effects: finalEffectsStr,
        stock: parseInt(data.stock) || 0,
        featured: data.featured || false,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
