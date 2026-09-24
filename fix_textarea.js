const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/mr-konteks/page.tsx', 'utf8');

c = c.replace(
  /<Input\s+id="sumberData"\s+placeholder="Contoh: Renstra, DIPA, dll"\s+value=\{sumberData\}\s+onChange=\{\(e\) => setSumberData\(e.target.value\)\}\s+required\s+\/>/m,
  '<Textarea id="sumberData" placeholder="Contoh: Renstra, DIPA, dll" value={sumberData} onChange={(e) => setSumberData(e.target.value)} required rows={3} className="min-h-[80px]" />'
);

fs.writeFileSync('src/app/dashboard/mr-konteks/page.tsx', c);
console.log('Modified src/app/dashboard/mr-konteks/page.tsx');
