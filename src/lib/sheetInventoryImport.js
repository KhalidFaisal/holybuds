/**
 * Google Sheet Box Inventory Import utilities.
 * Handles fetching CSV from public Google Sheet export,
 * parsing RFC 4180 CSV, filtering excluded categories (Accessories & Wholesale),
 * and strictly exact name matching against database products.
 * Strictly NO emojis.
 */

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1fWec4WxJ57kIYLCLreXgQ0KfMb9KIPr4d0FwVGyqIPc/edit?usp=sharing';
export const DEFAULT_SHEET_TAB = 'TEMPLATE';

// Column mapping definitions
export const COLUMN_MAPPING = {
  BOX_1: { colIndex: 2, label: 'Box 1 shelf (Col C)', boxIdentifier: '1' },
  BOX_2: { colIndex: 3, label: 'Box 2 shelf (Col D)', boxIdentifier: '2' },
  BOX_3: { colIndex: 4, label: 'Box 3 shelf (Col E)', boxIdentifier: '3' },
  BOX_4: { colIndex: 5, label: 'Box 4 shelf (Col F)', boxIdentifier: '4' }
};

/**
 * Parses Google Sheet URL to extract the spreadsheet ID.
 */
export function extractSpreadsheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Builds the public CSV export URL for a Google Sheet and Tab.
 */
export function buildCsvExportUrl(sheetUrl, sheetTab = 'TEMPLATE') {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL. Could not extract spreadsheet ID.');
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTab)}`;
}

/**
 * Fetches the raw CSV string for a Google Sheet.
 */
export async function fetchGoogleSheetCsv(sheetUrl = DEFAULT_SHEET_URL, sheetTab = DEFAULT_SHEET_TAB) {
  const exportUrl = buildCsvExportUrl(sheetUrl, sheetTab);
  const response = await fetch(exportUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/csv,text/plain,*/*' },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV: HTTP ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * RFC 4180 compliant CSV parser.
 * Handles quoted cells, escaped quotes (""), and commas within values.
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  return lines.map(line => {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur.trim());
    return row;
  });
}

/**
 * Checks whether a given section or category should be excluded from box inventory import.
 * Excludes both Accessories and Wholesale categories.
 */
export function isExcludedCategory(categoryName = '', sectionName = '') {
  const cat = (categoryName || '').toLowerCase().trim();
  const sec = (sectionName || '').toLowerCase().trim();

  // Exclude Accessories
  if (
    cat === 'accessories' ||
    cat === 'accessory' ||
    cat.includes('accessories') ||
    sec === 'accessories' ||
    sec.includes('accessories')
  ) {
    return true;
  }

  // Exclude Wholesale
  if (
    cat === 'wholesale' ||
    cat.includes('wholesale') ||
    sec === 'wholesale' ||
    sec.includes('wholesale')
  ) {
    return true;
  }

  return false;
}

/**
 * Known section headers in the Holy Buds Google Sheet template.
 */
const KNOWN_SECTIONS = [
  'NAME 1/2s',
  'Pre-Rolls',
  'Vapes',
  'Wax/Concentrates',
  'Edibles',
  'Wholesale',
  'Accessories'
];

/**
 * Matches sheet rows to database products.
 * Exact name matching only (case-insensitive trimmed).
 * Evaluates blanks as 0.
 * Skips accessories and wholesale items.
 *
 * @param {Array<Array<string>>} rows - Parsed CSV rows
 * @param {string} columnKey - 'BOX_1', 'BOX_2', 'BOX_3', 'BOX_4'
 * @param {Array} dbProducts - Active database products
 * @param {Array} currentBoxItems - Current items in the target box
 * @returns {object} { matched, unmatched, skipped, summary }
 */
export function matchSheetToProducts(rows = [], columnKey = 'BOX_1', dbProducts = [], currentBoxItems = []) {
  const colDef = COLUMN_MAPPING[columnKey] || COLUMN_MAPPING.BOX_1;
  const colIndex = colDef.colIndex;

  // Build lookup map for database products by exact lowercase trimmed name
  const dbByName = new Map();
  const currentBoxQtyByProductId = new Map();

  (currentBoxItems || []).forEach(item => {
    currentBoxQtyByProductId.set(item.productId, item.expectedQuantity || 0);
  });

  (dbProducts || []).forEach(product => {
    const pName = (product.name || '').trim().toLowerCase();
    if (pName) {
      dbByName.set(pName, product);
    }
  });

  let currentSection = 'NAME 1/2s';
  const matched = [];
  const unmatched = [];
  const skipped = [];

  // Start from row 1 to skip the header line (Row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = (row[0] || '').trim();
    if (!rawName) continue;

    // Detect section headers
    const matchedSectionHeader = KNOWN_SECTIONS.find(
      s => s.toLowerCase() === rawName.toLowerCase()
    );

    if (matchedSectionHeader) {
      currentSection = matchedSectionHeader;
      skipped.push({
        sheetName: rawName,
        rowNumber: i + 1,
        reason: 'Section Header',
        section: currentSection
      });
      continue;
    }

    // Check if row belongs to an excluded section (Accessories or Wholesale)
    if (isExcludedCategory('', currentSection)) {
      skipped.push({
        sheetName: rawName,
        rowNumber: i + 1,
        reason: currentSection === 'Wholesale' ? 'Wholesale' : 'Accessories',
        section: currentSection
      });
      continue;
    }

    // Parse count from target column (for blank, 0)
    const rawCountStr = row[colIndex] !== undefined ? String(row[colIndex]).trim() : '';
    const newQty = rawCountStr === '' ? 0 : Math.max(0, parseInt(rawCountStr, 10) || 0);

    // Exact name matching: case-insensitive, trimmed
    const lookupKey = rawName.toLowerCase();
    const product = dbByName.get(lookupKey);

    if (product) {
      // Check if product itself has an excluded category in DB
      if (isExcludedCategory(product.category, currentSection)) {
        skipped.push({
          sheetName: rawName,
          rowNumber: i + 1,
          productId: product.id,
          productName: product.name,
          reason: (product.category || '').toLowerCase().includes('wholesale') ? 'Wholesale' : 'Accessories',
          section: currentSection
        });
        continue;
      }

      const currentQty = currentBoxQtyByProductId.get(product.id) || 0;
      const change = newQty - currentQty;

      matched.push({
        sheetName: rawName,
        productId: product.id,
        productName: product.name,
        category: product.category || currentSection,
        section: currentSection,
        currentQty,
        newQty,
        change,
        rowNumber: i + 1
      });
    } else {
      unmatched.push({
        sheetName: rawName,
        section: currentSection,
        newQty,
        rowNumber: i + 1
      });
    }
  }

  const totalUnits = matched.reduce((sum, item) => sum + item.newQty, 0);
  const zeroCountItems = matched.filter(item => item.newQty === 0).length;

  return {
    columnKey,
    columnLabel: colDef.label,
    matched,
    unmatched,
    skipped,
    summary: {
      totalMatched: matched.length,
      totalUnits,
      zeroCountItems,
      totalUnmatched: unmatched.length,
      totalSkipped: skipped.length
    }
  };
}

