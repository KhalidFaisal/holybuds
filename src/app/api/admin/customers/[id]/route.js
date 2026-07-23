import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (typeof body.points !== 'number') {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { points: body.points }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if the customer exists and get its userId
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // We can delete them in a transaction or sequentially.
    // If we delete the User, the Customer might not cascade if we didn't set onDelete: Cascade. 
    // In our schema, User doesn't cascade delete Customer. So we delete Customer first.
    
    await prisma.customer.delete({
      where: { id }
    });

    // If the customer was linked to a web account, delete the web account too.
    if (customer.userId) {
      await prisma.user.delete({
        where: { id: customer.userId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
