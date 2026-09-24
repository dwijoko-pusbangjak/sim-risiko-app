const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  replacements.forEach(({from, to}) => {
    newContent = newContent.replace(from, to);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Modified ${filePath}`);
  }
}

// 1. src/app/dashboard/layout.tsx
replaceInFile('src/app/dashboard/layout.tsx', [
  { from: /SIM<span className="text-emerald-500">-Risiko<\/span>/g, to: 'Si<span className="text-emerald-500">-MaRi</span>' },
  { from: /SIM<span className="text-emerald-600">-Risiko<\/span>/g, to: 'Si<span className="text-emerald-600">-MaRi</span>' }
]);

// 2. src/app/login/page.tsx
replaceInFile('src/app/login/page.tsx', [
  { from: /SIM-Risiko/g, to: 'Si-MaRi' }
]);

// 3. src/app/dashboard/settings/page.tsx
replaceInFile('src/app/dashboard/settings/page.tsx', [
  { from: /SIM Risiko/g, to: 'Si-MaRi' }
]);
