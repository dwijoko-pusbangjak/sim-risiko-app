const fs = require('fs');
let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace('import { Plus_Jakarta_Sans } from "next/font/google";', 'import { Inter } from "next/font/google";');
c = c.replace('const font = Plus_Jakarta_Sans({ subsets: ["latin"] });', 'const font = Inter({ subsets: ["latin"] });');

fs.writeFileSync('src/app/layout.tsx', c);
console.log('Modified font in layout.tsx');
