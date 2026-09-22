import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const updateData = {};

    if (data.confirmed !== undefined) {
      updateData.confirmed = Boolean(data.confirmed);
    }
    if (data.person !== undefined) {
      updateData.person = data.person.trim();
    }
    if (data.driverId !== undefined) {
      updateData.driverId = data.driverId || null;
    }
    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
    }
    if (data.form !== undefined) {
      updateData.form = data.form;
    }
    if (data.amount !== undefined && !isNaN(Number(data.amount))) {
      updateData.amount = parseFloat(data.amount);
    }
    if (data.note !== undefined) {
      updateData.note = data.note.trim();
    }

    const updated = await prisma.cashTrackerEntry.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating cash tracker entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.cashTrackerEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cash tracker entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
