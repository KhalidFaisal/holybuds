import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    
    if (!query) {
      return NextResponse.json({ products: [], orders: [], customers: [] });
    }

    // 1. Search Products
    const products = await prisma.product.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      take: 10
    });

    // 2. Search Orders (by orderNumber, customerName, customerPhone, or containing the queried product)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { customerPhone: { contains: query, mode: 'insensitive' } },
          {
            items: {
              some: {
                product: {
                  name: { contains: query, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // 3. Search Customers (by name, phone, or who bought the queried product)
    const customerOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerName: { contains: query, mode: 'insensitive' } },
          { customerPhone: { contains: query, mode: 'insensitive' } },
          {
            items: {
              some: {
                product: {
                  name: { contains: query, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['customerPhone'],
      take: 10,
      select: {
        customerName: true,
        customerPhone: true
      }
    });

    return NextResponse.json({ products, orders, customers: customerOrders });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
