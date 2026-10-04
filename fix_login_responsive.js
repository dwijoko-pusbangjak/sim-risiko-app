const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// 1. Container sizing
c = c.replace(
  'max-w-[1000px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[600px]',
  'max-w-[850px] lg:max-w-[1000px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[500px] lg:min-h-[600px]'
);

// 2. Left side fonts
c = c.replace(
  'text-3xl font-extrabold text-white mb-3 tracking-tight',
  'text-2xl lg:text-3xl font-extrabold text-white mb-3 tracking-tight'
);
c = c.replace(
  'text-base text-slate-200 max-w-sm font-medium leading-relaxed',
  'text-sm lg:text-base text-slate-200 max-w-sm font-medium leading-relaxed'
);
c = c.replace(
  '<ShieldCheck className="w-14 h-14 text-white" />',
  '<ShieldCheck className="w-12 h-12 lg:w-14 lg:h-14 text-white" />'
);

// 3. Right side form sizing
c = c.replace(
  'w-full max-w-[360px] space-y-8',
  'w-full max-w-[320px] lg:max-w-[360px] space-y-6 lg:space-y-8'
);

// 4. "Masuk" Title
c = c.replace(
  '<h2 className="text-3xl font-bold tracking-tight text-slate-900">Masuk</h2>',
  '<h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Masuk</h2>'
);

// 5. Input Labels
c = c.replace(
  'text-slate-700 font-semibold',
  'text-slate-700 font-semibold text-sm'
);
c = c.replace(
  'text-slate-700 font-semibold',
  'text-slate-700 font-semibold text-sm'
);
c = c.replace(
  'text-slate-700 font-semibold',
  'text-slate-700 font-semibold text-sm'
); // Run multiple times if there are multiple occurrences

// Ensure all occurrences of the labels are updated to text-sm if they aren't already
c = c.replace(/className="text-slate-700 font-semibold"/g, 'className="text-slate-700 font-semibold text-sm"');
// Wait, Tailwind's default Label is text-sm anyway. Let's make it text-sm if it was default, or text-xs lg:text-sm if we want it smaller.
c = c.replace(/className="text-slate-700 font-semibold( text-sm)?"/g, 'className="text-slate-700 font-semibold text-xs lg:text-sm"');

// 6. Subtext "Silakan masuk ke akun Anda"
c = c.replace(
  '<p className="text-sm text-slate-500 font-medium">',
  '<p className="text-xs lg:text-sm text-slate-500 font-medium">'
);

// 7. Padding for the right section
c = c.replace(
  'className="w-full md:w-[50%] p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center relative bg-white"',
  'className="w-full md:w-[50%] p-6 md:p-8 lg:p-16 flex flex-col justify-center items-center relative bg-white"'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified login layout and fonts');
