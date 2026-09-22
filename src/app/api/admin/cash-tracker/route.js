import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const person = searchParams.get('person');
    const form = searchParams.get('form');
    const confirmed = searchParams.get('confirmed');

    const where = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (person && person !== 'ALL') {
      where.person = { equals: person, mode: 'insensitive' };
    }

    if (form && form !== 'ALL') {
      if (form.toLowerCase() === 'payroll' || form.toLowerCase() === 'payout') {
        where.amount = { lt: 0 };
      } else {
        where.form = { equals: form, mode: 'insensitive' };
        if (form.toLowerCase() === 'cash') {
          where.amount = { gte: 0 };
        }
      }
    }

    if (confirmed !== null && confirmed !== undefined && confirmed !== '' && confirmed !== 'ALL') {
      where.confirmed = confirmed === 'true';
    }

    const [entries, drivers] = await Promise.all([
      prisma.cashTrackerEntry.findMany({
        where,
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          driver: {
            select: { id: true, name: true, phone: true }
          }
        }
      }),
      prisma.driver.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ]);

    // Calculate dynamic summary metrics from current filtered entries
    let totalCashDrops = 0;
    let totalCashPayouts = 0;
    let totalZelle = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    for (const item of entries) {
      const amt = Number(item.amount) || 0;
      const f = (item.form || '').toLowerCase();

      if (!item.confirmed) {
        pendingAmount += amt;
        pendingCount += 1;
      }

      if (amt < 0) {
        totalCashPayouts += amt; // already negative
      } else if (f.includes('zelle')) {
        totalZelle += amt;
      } else {
        totalCashDrops += amt;
      }
    }

    const netCashOnHand = totalCashDrops + totalCashPayouts; // payouts subtract naturally
    const grandTotal = netCashOnHand + totalZelle;

    return NextResponse.json({
      entries,
      drivers,
      summary: {
        totalCashDrops,
        totalCashPayouts,
        netCashOnHand,
        totalZelle,
        pendingAmount,
        pendingCount,
        grandTotal,
      }
    });
  } catch (error) {
    console.error('Error fetching cash tracker entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Check for batch import array
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : null;

    if (items) {
      if (!items.length) {
        return NextResponse.json({ error: 'No items provided for import' }, { status: 400 });
      }

      const formatted = items
        .filter((item) => item.person && item.amount !== undefined && !isNaN(Number(item.amount)))
        .map((item) => {
          const parsedAmount = parseFloat(item.amount);
          let formType = item.form || (parsedAmount < 0 ? 'cash' : 'Cash');
          if (parsedAmount < 0 && formType.toLowerCase() === 'cash') formType = 'cash';
          return {
            person: String(item.person).trim(),
            driverId: item.driverId || null,
            date: item.date ? new Date(item.date) : new Date(),
            confirmed: item.confirmed !== undefined ? Boolean(item.confirmed) : true,
            form: formType,
            amount: parsedAmount,
            note: String(item.note || '').trim(),
          };
        });

      if (!formatted.length) {
        return NextResponse.json({ error: 'No valid rows found to import' }, { status: 400 });
      }

      const result = await prisma.cashTrackerEntry.createMany({
        data: formatted,
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    // Single item creation
    const { person, driverId, date, confirmed, form, amount, note } = data;

    if (!person || amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Person and valid amount are required' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    const formType = form || (parsedAmount < 0 ? 'cash' : 'Cash');

    const entry = await prisma.cashTrackerEntry.create({
      data: {
        person: person.trim(),
        driverId: driverId || null,
        date: date ? new Date(date) : new Date(),
        confirmed: confirmed !== undefined ? Boolean(confirmed) : true,
        form: formType,
        amount: parsedAmount,
        note: (note || '').trim(),
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error creating cash tracker entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
