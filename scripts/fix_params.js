const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (file === 'route.js' && fullPath.includes('[') && fullPath.includes(']')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(path.join(__dirname, '../src/app/api'));
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const regex1 = /const\s+\{\s*([a-zA-Z0-9_, ]+)\s*\}\s*=\s*params\s*;/g;
  content = content.replace(regex1, (match, vars) => {
    changed = true;
    return `const { ${vars} } = await params;`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log('Updated:', file);
  }
}
console.log('Total updated:', updatedCount);
