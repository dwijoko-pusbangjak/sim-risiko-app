const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

c = c.replace(
  /<a href=\{rtp\.pemantauan\.linkEviden\} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link<\/a>/g,
  '<a href={rtp.pemantauan.linkEviden} target="_blank" rel="noreferrer" className="text-blue-600 underline">{rtp.pemantauan.linkEviden}</a>'
);

c = c.replace(
  /<td className="border border-black p-2 text-center text-xs break-all">/g,
  '<td className="border border-black p-2 text-left text-xs break-all max-w-[200px]">'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Fixed laporan link display');
