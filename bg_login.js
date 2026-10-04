const fs = require('fs');

let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

const targetStr = `<div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Dekorasi Latar Belakang */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100 blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-[100px] opacity-60"></div>
      </div>`;

const newStr = `<div className="flex min-h-screen w-full items-center justify-center p-4 relative overflow-hidden">
      {/* Gambar Latar Belakang Penuh */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-kemendes.jpg')" }}
      />
      {/* Overlay Samar (Blur + Warna Gelap) */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-none" />`;

c = c.replace(targetStr, newStr);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified src/app/login/page.tsx');
