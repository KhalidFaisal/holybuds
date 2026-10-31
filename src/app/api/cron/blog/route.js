import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateBlogPost } from '@/lib/blogGenerator';
import { saveBlogPost } from '@/lib/blogStorage';

async function handleCron(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secretParam = searchParams.get('secret');
    const isForce = searchParams.get('force') === 'true';

    // Verify secret if CRON_SECRET is configured
    if (process.env.CRON_SECRET) {
      const isValidBearer = authHeader === `Bearer ${process.env.CRON_SECRET}`;
      const isValidParam = secretParam === process.env.CRON_SECRET;
      if (!isValidBearer && !isValidParam) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    // Check SiteSettings
    let settings = null;
    try {
      if (prisma && prisma.siteSettings) {
        settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
      }
    } catch (err) {
      console.warn('Could not read site settings in cron:', err.message);
    }

    if (!settings?.autoBlogEnabled && !isForce) {
      return NextResponse.json({
        success: false,
        message: 'Automated blog generation is currently disabled in Admin settings.'
      });
    }

    const intervalHours = settings?.autoBlogIntervalHours || 24;
    const lastRun = settings?.autoBlogLastRun ? new Date(settings.autoBlogLastRun).getTime() : 0;
    const now = Date.now();
    const elapsedHours = (now - lastRun) / (1000 * 60 * 60);

    if (elapsedHours < intervalHours && !isForce) {
      return NextResponse.json({
        success: true,
        message: `Not due yet. ${Math.round((intervalHours - elapsedHours) * 10) / 10} hours remaining until next generation.`,
        lastRun: settings.autoBlogLastRun,
        intervalHours
      });
    }

    // Generate unique article
    const generated = await generateBlogPost();
    const saved = await saveBlogPost(generated);

    // Update last run time
    try {
      if (prisma && prisma.siteSettings) {
        await prisma.siteSettings.update({
          where: { id: 'global' },
          data: { autoBlogLastRun: new Date() }
        });
      }
    } catch (updateErr) {
      console.warn('Failed to update autoBlogLastRun:', updateErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Automated article generated and published',
      post: saved
    });
  } catch (error) {
    console.error('Error in /api/cron/blog:', error);
    return NextResponse.json(
      { error: error.message || 'Cron generation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handleCron(request);
}

export async function POST(request) {
  return handleCron(request);
}

