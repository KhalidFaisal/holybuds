import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { cartItems } = await request.json();

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 });
    }

    const messages = [];
    const updatedItems = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id }
      });

      // Product deleted or hidden
      if (!product || !product.isVisible) {
        messages.push(`"${item.name}" is no longer available and was removed from your cart.`);
        continue; // skip adding to updatedItems
      }

      // Stock depleted completely
      if (product.stock === 0) {
        messages.push(`"${product.name}" just stocked out and was removed from your cart.`);
        continue;
      }

      // Stock is less than cart quantity
      if (product.stock < item.quantity) {
        messages.push(`"${product.name}" only has ${product.stock} left in stock. We've adjusted your quantity.`);
        updatedItems.push({
          ...item,
          quantity: product.stock,
          stock: product.stock,
          price: product.price, // ensure price is synced too
        });
        continue;
      }

      // Valid item
      updatedItems.push({
        ...item,
        stock: product.stock,
        price: product.price,
      });
    }

    return NextResponse.json({ items: updatedItems, messages });
  } catch (error) {
    console.error('Cart sync error:', error);
    return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
  }
}
