const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');
c = c.replace(/const \[sasaranList, setSasaranList\] = useState<any\[\]>\(\[\]\);\\n  const \[strategisList, setStrategisList\] = useState<any\[\]>\(\[\]\);\\n  const \[programList, setProgramList\] = useState<any\[\]>\(\[\]\);\\n  const \[kegiatanList, setKegiatanList\] = useState<any\[\]>\(\[\]\);/,
`const [sasaranList, setSasaranList] = useState<any[]>([]);
  const [strategisList, setStrategisList] = useState<any[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);`);
fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
