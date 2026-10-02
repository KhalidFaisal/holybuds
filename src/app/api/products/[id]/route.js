import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product || (!product.isVisible && !requireAdmin(request))) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categories !== undefined) {
      let categoriesArr = [];
      if (Array.isArray(data.categories)) {
        categoriesArr = data.categories;
      } else if (typeof data.categories === 'string' && data.categories.startsWith('[')) {
        try { categoriesArr = JSON.parse(data.categories); } catch(e) {}
      } else if (data.categories) {
        categoriesArr = [data.categories];
      }
      updateData.categories = JSON.stringify(categoriesArr);
      if (categoriesArr.length > 0 && !data.category) {
        updateData.category = categoriesArr[0];
      }
    }
    if (data.category !== undefined) {
      updateData.category = data.category;
      if (updateData.categories) {
        try {
          const arr = JSON.parse(updateData.categories);
          if (!arr.includes(data.category)) {
            arr.unshift(data.category);
            updateData.categories = JSON.stringify(arr);
          }
        } catch(e) {}
      }
    }
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.description !== undefined) updateData.description = data.description;
    
    if (data.images !== undefined || data.image !== undefined) {
      let imagesArr = [];
      if (Array.isArray(data.images)) {
        imagesArr = data.images;
      } else if (data.image) {
        imagesArr = [data.image];
      }
      updateData.image = imagesArr.length > 0 ? imagesArr[0] : '';
      updateData.images = JSON.stringify(imagesArr);
    }
    
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock) || 0;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
