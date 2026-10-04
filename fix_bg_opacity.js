const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(
  `<div className="flex min-h-screen w-full items-center justify-center p-4 relative overflow-hidden">
      {/* Gambar Latar Belakang Penuh */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-kemendes.jpg')" }}
      />
      {/* Overlay Samar (Blur + Warna Gelap) */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-none" />`,
  `<div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      {/* Gambar Latar Belakang Penuh */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20 mix-blend-multiply"
        style={{ backgroundImage: "url('/bg-kemendes.jpg')" }}
      />
      {/* Overlay Blur Halus */}
      <div className="absolute inset-0 backdrop-blur-sm pointer-events-none" />`
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified opacity on background');
