const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Pattern: { id: something.id, ...data }
    // Example: { id: d.id, ...d.data() }
    content = content.replace(/\{\s*id:\s*([a-zA-Z0-9_]+)\.id,\s*\.\.\.([a-zA-Z0-9_]+(\.data\(\))?)\s*\}/g, '{ ...$2, id: $1.id }');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
