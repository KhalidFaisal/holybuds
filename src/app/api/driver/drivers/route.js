import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    // Verify it's a valid driver requesting
    const driver = await prisma.driver.findUnique({
      where: { id: token }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const allDrivers = await prisma.driver.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    // Strip sensitive info (pin, phone)
    const safeDrivers = allDrivers.map(d => ({
      id: d.id,
      name: d.name,
      isActive: d.isActive
    }));

    return NextResponse.json(safeDrivers);
  } catch (error) {
    console.error('Error fetching drivers for driver portal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
