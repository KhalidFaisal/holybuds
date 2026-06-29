import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
    }

    // 1. Fetch from Google Sheets
    let sheetData;
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        // Removed Content-Type header as it can break Apps Script redirects for GET requests
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Apps Script Error Response:', errorText);
        throw new Error(`Google Script returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
      sheetData = await response.json();
    } catch (fetchError) {
      console.error('Failed to fetch from Google Sheet:', fetchError);
      return NextResponse.json({ error: `Failed to read from Google Sheet: ${fetchError.message}` }, { status: 500 });
    }

    if (sheetData.error) {
      return NextResponse.json({ error: sheetData.error }, { status: 500 });
    }

    const sheetProducts = sheetData.products || [];

    // 2. Fetch from Database
    const dbProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        isVisible: true,
      }
    });

    // 3. Compare Lists
    const missingFromSite = [];
    const missingFromSheet = [];
    const stockMismatch = [];

    // Build lookup maps (case insensitive trimming)
    const dbMap = new Map();
    dbProducts.forEach(p => {
      const key = p.name.trim().toLowerCase();
      dbMap.set(key, p);
    });

    const sheetMap = new Map();
    sheetProducts.forEach(p => {
      const key = p.name.trim().toLowerCase();
      sheetMap.set(key, p);
    });

    // Find Missing from Site & Stock Mismatches
    sheetMap.forEach((sheetItem, key) => {
      if (!dbMap.has(key)) {
        missingFromSite.push({
          name: sheetItem.name,
          sheetStock: sheetItem.quantity
        });
      } else {
        const dbItem = dbMap.get(key);
        if (dbItem.stock !== sheetItem.quantity) {
          stockMismatch.push({
            id: dbItem.id,
            name: dbItem.name,
            dbStock: dbItem.stock,
            sheetStock: sheetItem.quantity
          });
        }
      }
    });

    // Find Missing from Sheet
    dbMap.forEach((dbItem, key) => {
      if (!sheetMap.has(key)) {
        missingFromSheet.push({
          id: dbItem.id,
          name: dbItem.name,
          dbStock: dbItem.stock,
          isVisible: dbItem.isVisible
        });
      }
    });

    return NextResponse.json({
      missingFromSite,
      missingFromSheet,
      stockMismatch,
      lastSynced: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audit Error:', error);
    return NextResponse.json({ error: 'Failed to run audit' }, { status: 500 });
  }
}
