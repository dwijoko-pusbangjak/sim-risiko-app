const fs = require('fs');

let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(
  '<div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col md:flex-row z-10 min-h-[600px] border border-white/20">',
  '<div className="w-full max-w-[1000px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[600px]" style={{ boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 20px 40px -20px rgba(0,0,0,0.6)" }}>'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified shadow inline');
