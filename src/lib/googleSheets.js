import prisma from '@/lib/prisma';

/**
 * Builds array of row data (columns A-K) for an individual order.
 */
export function buildGoogleSheetRowsForOrder(order, discount = null) {
  const itemsSubtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const rawDeliveryFee = (order.total || 0) + (order.discountAmount || 0) - itemsSubtotal;
  const deliveryFee = rawDeliveryFee > 0 ? Math.round(rawDeliveryFee * 100) / 100 : 0;

  let qualifyingTotal = 0;
  let targetIds = [];
  if (discount && discount.targetType === 'SPECIFIC_PRODUCTS' && discount.targetProductIds) {
    try {
      targetIds = JSON.parse(discount.targetProductIds);
    } catch {
      targetIds = [];
    }
  }

  const itemEligibility = (order.items || []).map(item => {
    let eligible = false;
    if (discount) {
      if (discount.targetType === 'ENTIRE_ORDER') eligible = true;
      else if (discount.targetType === 'CATEGORY' && item.product?.category === discount.targetCategory) eligible = true;
      else if (discount.targetType === 'SPECIFIC_PRODUCTS' && targetIds.includes(item.productId)) eligible = true;
    }
    const lineTotal = item.price * item.quantity;
    if (eligible) qualifyingTotal += lineTotal;
    return { ...item, eligible, lineTotal };
  });

  return itemEligibility.map(item => {
    let itemDiscount = 0;
    if (item.eligible && qualifyingTotal > 0 && (order.discountAmount || 0) > 0) {
      const proportion = item.lineTotal / qualifyingTotal;
      itemDiscount = proportion * order.discountAmount;
    }
    const finalLineTotal = item.lineTotal - itemDiscount;

    const rowData = Array(11).fill(''); // A through K (0 to 10)
    rowData[2] = item.product?.name || 'Product'; // C column
    rowData[3] = item.quantity; // D column
    rowData[4] = Math.round(finalLineTotal * 100) / 100; // E column (discounted line total)
    rowData[6] = order.customerName || ''; // G column
    rowData[10] = deliveryFee > 0 ? deliveryFee : ''; // K column
    return rowData;
  });
}

/**
 * Sends rows for one or multiple completed orders to the Google Sheets webhook in a single batch request.
 * Should be called OUTSIDE database transactions.
 */
export async function syncCompletedOrdersToGoogleSheets(orders, prismaClient = prisma) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !orders || orders.length === 0) return;

  try {
    const discountNames = [...new Set(orders.map(o => o.discountName).filter(Boolean))];
    const discountsMap = {};
    if (discountNames.length > 0 && prismaClient) {
      const discounts = await prismaClient.discount.findMany({
        where: { name: { in: discountNames } }
      });
      for (const d of discounts) {
        discountsMap[d.name] = d;
      }
    }

    const allRows = [];
    for (const order of orders) {
      const discount = discountsMap[order.discountName] || null;
      const rows = buildGoogleSheetRowsForOrder(order, discount);
      allRows.push(...rows);
    }

    if (allRows.length === 0) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allRows)
    });
  } catch (err) {
    console.error('Failed to sync completed orders to Google Sheets:', err);
  }
}
