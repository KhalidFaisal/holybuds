import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true }
    });

    if (!user || !user.customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        name: name !== undefined ? name : user.customer.name,
        phone: phone !== undefined ? phone : user.customer.phone,
        address: address !== undefined ? address : user.customer.address,
      }
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error('Profile update error:', error);
    // Handle unique phone error specifically
    if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
      return NextResponse.json({ error: 'This phone number is already linked to another account' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
