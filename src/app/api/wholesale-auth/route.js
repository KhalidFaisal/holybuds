import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
    });

    const validPasscode = settings?.wholesalePassword || 'Onlyholy';

    if (passcode === validPasscode) {
      // Set a secure, HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'wholesale_access',
        value: 'true',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'strict',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 });
  } catch (error) {
    console.error('Wholesale Auth Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
