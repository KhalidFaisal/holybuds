import prisma from './prisma';

/**
 * Attaches discount information to a single product or array of products.
 * Adds `calculatedDiscountPrice` (if unconditional discount applies) 
 * and `eligibleDiscountNames` (array of strings) to each product.
 */
export async function withProductDiscounts(products) {
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];

  // Fetch active discounts
  const activeDiscounts = await prisma.discount.findMany({
    where: { isActive: true },
  });

  const enrichedItems = items.map(product => {
    let bestUnconditionalPrice = product.price;
    let bestDiscountName = null;
    let maxDiscountAmount = -1;

    activeDiscounts.forEach(d => {
      // Check if discount targets this product
      let applies = false;
      if (d.targetType === 'ENTIRE_ORDER') {
        applies = true;
      } else if (d.targetType === 'CATEGORY' && product.category === d.targetCategory) {
        applies = true;
      } else if (d.targetType === 'SPECIFIC_PRODUCTS' && d.targetProductIds) {
        try {
          const targetIds = JSON.parse(d.targetProductIds);
          if (targetIds.includes(product.id)) applies = true;
        } catch (e) {}
      }

      if (applies) {
        // Skip discounts that require multiple items for the single-item strikethrough calculation
        if (d.minItemQuantity > 1 || d.type === 'BULK_FIXED') {
          // We can still add it to eligibleDiscountNames so they see the badge
          bestDiscountName = d.name;
          return;
        }

        let discountAmount = d.type === 'PERCENTAGE' 
          ? product.price * (d.value / 100) 
          : d.value;
        
        if (discountAmount > product.price) discountAmount = product.price;

        // Keep track of the highest value discount name
        if (discountAmount > maxDiscountAmount) {
          maxDiscountAmount = discountAmount;
          bestDiscountName = d.name;
        }

        // Calculate strikethrough price ONLY if unconditional (minOrderValue === 0)
        if (d.minOrderValue === 0) {
          const potentialPrice = product.price - discountAmount;
          if (potentialPrice < bestUnconditionalPrice) {
            bestUnconditionalPrice = potentialPrice;
          }
        }
      }
    });

    return {
      ...product,
      calculatedDiscountPrice: bestUnconditionalPrice < product.price ? bestUnconditionalPrice : null,
      eligibleDiscountNames: bestDiscountName ? [bestDiscountName] : null,
    };
  });

  return isArray ? enrichedItems : enrichedItems[0];
}
