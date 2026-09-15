const fs = require('fs');

const content = `export default function Page() { 
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Halaman dalam tahap pengembangan...</h2>
      <p className="text-slate-500">Modul ini akan segera hadir.</p>
    </div>
  );
}`;

const paths = [
  'src/app/dashboard/mr-konteks/page.tsx',
  'src/app/dashboard/mr-identifikasi/page.tsx',
  'src/app/dashboard/mr-analisis/page.tsx',
  'src/app/dashboard/mr-rtp/page.tsx',
  'src/app/dashboard/mr-pemantauan/page.tsx',
  'src/app/dashboard/mr-keterjadian/page.tsx',
  'src/app/dashboard/mr-efektifitas/page.tsx'
];

paths.forEach(p => {
  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${p}`);
});
