import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import {
  fetchGoogleSheetCsv,
  parseCSV,
  matchSheetToProducts,
  DEFAULT_SHEET_URL,
  DEFAULT_SHEET_TAB
} from '@/lib/sheetInventoryImport';

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { action } = data;

    if (action === 'PREVIEW') {
      const {
        sheetUrl = DEFAULT_SHEET_URL,
        sheetTab = DEFAULT_SHEET_TAB,
        boxId,
        columnKey = 'BOX_1'
      } = data;

      if (!boxId) {
        return NextResponse.json({ error: 'Target boxId is required.' }, { status: 400 });
      }

      const targetBox = await prisma.inventoryBox.findUnique({
        where: { id: boxId },
        include: { items: true }
      });

      if (!targetBox) {
        return NextResponse.json({ error: 'Selected box does not exist.' }, { status: 404 });
      }

      // Fetch all products to evaluate name matching and exclude wholesale/accessories
      const allProducts = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          categories: true,
          isVisible: true
        }
      });

      // Fetch and parse the CSV from Google Sheets
      const csvContent = await fetchGoogleSheetCsv(sheetUrl, sheetTab);
      const rows = parseCSV(csvContent);

      if (rows.length < 2) {
        return NextResponse.json({
          error: 'The sheet is empty or does not contain product rows.'
        }, { status: 400 });
      }

      const matchResults = matchSheetToProducts(rows, columnKey, allProducts, targetBox.items);

      return NextResponse.json({
        success: true,
        box: { id: targetBox.id, name: targetBox.name },
        sheetUrl,
        sheetTab,
        ...matchResults
      });
    }

    if (action === 'APPLY') {
      const {
        boxId,
        itemsToSet,
        sheetUrl = DEFAULT_SHEET_URL,
        sheetTab = DEFAULT_SHEET_TAB,
        columnKey = 'BOX_1',
        boxName = 'Box'
      } = data;

      if (!boxId || !itemsToSet || typeof itemsToSet !== 'object') {
        return NextResponse.json({ error: 'Missing boxId or itemsToSet object.' }, { status: 400 });
      }

      let totalUnits = 0;
      let updatedCount = 0;

      await prisma.$transaction(async (tx) => {
        const productIds = Object.keys(itemsToSet);
        const productsList = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        });

        const productMap = {};
        productsList.forEach(p => {
          productMap[p.id] = p.name;
        });

        const importEditsLog = {};

        for (const [productId, rawQuantity] of Object.entries(itemsToSet)) {
          const newQty = Math.max(0, parseInt(rawQuantity, 10) || 0);

          const existingItem = await tx.boxItem.findUnique({
            where: { boxId_productId: { boxId, productId } }
          });
          const oldQty = existingItem ? existingItem.expectedQuantity : 0;

          if (oldQty !== newQty) {
            importEditsLog[productId] = {
              name: productMap[productId] || 'Unknown Product',
              old: oldQty,
              new: newQty,
              diff: newQty - oldQty
            };
          }

          if (newQty > 0) {
            totalUnits += newQty;
            updatedCount++;
            await tx.boxItem.upsert({
              where: { boxId_productId: { boxId, productId } },
              update: { expectedQuantity: newQty },
              create: {
                boxId,
                productId,
                expectedQuantity: newQty
              }
            });
          } else {
            // Count of 0: delete record to keep box inventory clean
            await tx.boxItem.deleteMany({
              where: { boxId, productId }
            });
            updatedCount++;
          }
        }

        // Record audit log
        await tx.boxLog.create({
          data: {
            boxId,
            type: 'AUDIT',
            details: JSON.stringify({
              note: `Imported from Google Sheet (${columnKey}) into ${boxName}`,
              sheetUrl,
              sheetTab,
              columnKey,
              updatedCount,
              totalUnits,
              editsCount: Object.keys(importEditsLog).length,
              edits: importEditsLog
            })
          }
        });
      });

      return NextResponse.json({
        success: true,
        updatedCount,
        totalUnits
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling Google Sheet box import:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

