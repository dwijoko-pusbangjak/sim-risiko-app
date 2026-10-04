const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// 1. Container Size
c = c.replace(
  /w-full max-w-\[850px\] lg:max-w-\[1000px\] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-\[500px\] lg:min-h-\[600px\]/g,
  'w-full max-w-[750px] xl:max-w-[900px] bg-white rounded-2xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[400px] xl:min-h-[500px]'
);

// 2. Padding Form Side
c = c.replace(
  /w-full md:w-\[50%\] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white relative/g,
  'w-full md:w-[50%] flex items-center justify-center p-6 sm:p-8 bg-white relative'
);

// 3. Form Inner Max Width & Spacing
c = c.replace(
  /w-full max-w-\[320px\] lg:max-w-\[360px\] space-y-6 lg:space-y-8 animate-in/g,
  'w-full max-w-[320px] space-y-5 xl:space-y-6 animate-in'
);

// 4. Texts
c = c.replace(
  /text-2xl lg:text-3xl font-bold tracking-tight text-slate-900/g,
  'text-xl sm:text-2xl font-bold tracking-tight text-slate-900'
);

c = c.replace(
  /text-xs lg:text-sm text-slate-500 font-medium/g,
  'text-xs text-slate-500 font-medium'
);

// 5. Fix Label Duplicate "text-sm text-sm text-sm" and sizing
c = c.replace(
  /text-slate-700 font-semibold text-sm text-sm text-sm/g,
  'text-slate-700 font-semibold text-xs sm:text-sm'
);
c = c.replace(
  /className="text-slate-700 font-semibold text-sm"/g,
  'className="text-slate-700 font-semibold text-xs sm:text-sm"'
);

// 6. Input Sizes
c = c.replace(
  /h-11 bg-slate-50/g,
  'h-10 bg-slate-50'
);

// 7. Button Size
c = c.replace(
  /h-11 text-base/g,
  'h-10 text-sm'
);
c = c.replace(
  /className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold shadow-md shadow-emerald-600\/20 transition-all active:scale-\[0.98\]"/g,
  'className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Fixed login sizes');
