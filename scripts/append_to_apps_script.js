function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet Inventory not found" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var products = [];
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var name = data[i][2]; // Column C
    var quantity = data[i][6]; // Column G
    
    if (name) {
      products.push({
        name: String(name).trim(),
        quantity: parseInt(quantity) || 0
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ products: products })).setMimeType(ContentService.MimeType.JSON);
}
