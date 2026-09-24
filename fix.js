const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/mr-konteks/page.tsx', 'utf-8');
c = c.replace(/\\n  if \(authLoading/g, '\n  if (authLoading');
c = c.replace(/<\/div>\\n            <div className="flex justify-end pt-4 gap-3">/g, '</div>\n            <div className="flex justify-end pt-4 gap-3">');
fs.writeFileSync('src/app/dashboard/mr-konteks/page.tsx', c);
