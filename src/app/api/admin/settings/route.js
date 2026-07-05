import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'pc-super-secret-key-change-in-production';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'global', sitePassword: 'Holymoly' },
      });
    }

    return NextResponse.json({ 
      sitePassword: settings.sitePassword,
      timezone: settings.timezone || 'UTC',
      chatbotPrompt: settings.chatbotPrompt || "You are a helpful, friendly budtender at Elevated Dispensary. Recommend products from our inventory based on the user's needs. Be concise, polite, and use a chill tone.",
      aiModel: settings.aiModel || "openrouter/free",
      openRouterApiKey: settings.openRouterApiKey ? '••••••••••••••••' : '' // Masked in response
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();

    const updateData = {};
    if (data.sitePassword) {
      if (data.sitePassword.length < 4) {
        return NextResponse.json({ error: 'Site password must be at least 4 characters long' }, { status: 400 });
      }
      updateData.sitePassword = data.sitePassword;
    }

    if (data.adminPassword) {
      if (data.adminPassword.length < 4) {
        return NextResponse.json({ error: 'Admin password must be at least 4 characters long' }, { status: 400 });
      }
      updateData.adminPasswordHash = await bcrypt.hash(data.adminPassword, 10);
    }
    
    if (data.timezone) {
      updateData.timezone = data.timezone;
    }

    if (data.chatbotPrompt !== undefined) {
      updateData.chatbotPrompt = data.chatbotPrompt;
    }

    if (data.aiModel) {
      updateData.aiModel = data.aiModel;
    }

    if (data.openRouterApiKey !== undefined) {
      // Allow clearing the key if empty string is passed
      updateData.openRouterApiKey = data.openRouterApiKey === '' ? null : data.openRouterApiKey;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Update or create settings
    await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: updateData,
      create: {
        id: 'global',
        ...updateData
      },
    });

    return NextResponse.json({ success: true, ...updateData });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
