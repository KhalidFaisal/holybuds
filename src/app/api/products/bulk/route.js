import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await request.json();
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid payload, expected array' }, { status: 400 });
    }

    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        if (!p.name || !p.category || !p.price) {
          throw new Error('Missing required fields (name, category, price)');
        }

        let imagesArr = [];
        if (p.images) {
          imagesArr = p.images.split(',').map(url => url.trim()).filter(Boolean);
        } else if (p.image) {
          imagesArr = [p.image.trim()];
        }
        const primaryImage = imagesArr.length > 0 ? imagesArr[0] : '';

        const data = {
          name: p.name,
          category: p.category ? p.category.trim().toUpperCase() : 'EDIBLE',
          price: parseFloat(p.price) || 0,
          weight: p.weight || null,
          description: p.description || '',
          image: primaryImage,
          images: JSON.stringify(imagesArr),
          stock: parseInt(p.stock) || 0,
          featured: p.featured === 'true' || p.featured === true,
          isVisible: p.isVisible !== undefined ? (p.isVisible === 'true' || p.isVisible === true) : true,
        };

        if (p.id && p.id.trim() !== '') {
          // Try to update by ID
          const existing = await prisma.product.findUnique({ where: { id: p.id } });
          if (existing) {
            await prisma.product.update({
              where: { id: p.id },
              data,
            });
            results.updated++;
          } else {
            // ID provided but not found, could optionally create with that ID if the DB allows, 
            // but generally Prisma CUIDs are auto-generated. We'll just create new without ID.
            await prisma.product.create({ data });
            results.created++;
          }
        } else {
          // Create new
          await prisma.product.create({ data });
          results.created++;
        }
      } catch (error) {
        results.errors.push(`Row ${i + 1} (${p.name || 'Unknown'}): ${error.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to process bulk import' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid payload, expected array of IDs' }, { status: 400 });
    }

    const result = await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { productId: { in: ids } }
      }),
      prisma.product.deleteMany({
        where: { id: { in: ids } }
      })
    ]);

    // result[1] is the product deleteMany result
    return NextResponse.json({ success: true, count: result[1].count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to process bulk delete' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, isVisible, featured } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const data = {};
    if (isVisible !== undefined) data.isVisible = isVisible;
    if (featured !== undefined) data.featured = featured;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Failed to process bulk update' }, { status: 500 });
  }
}
