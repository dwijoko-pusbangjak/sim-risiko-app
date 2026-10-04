const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Replace max-w-[750px] xl:max-w-[900px] with max-w-4xl xl:max-w-5xl
// max-w-4xl = 56rem, max-w-5xl = 64rem
c = c.replace(/max-w-\[750px\] xl:max-w-\[900px\]/g, 'max-w-4xl xl:max-w-5xl');

// Replace min-h-[400px] xl:min-h-[500px] with min-h-[28rem] xl:min-h-[36rem]
// 28rem = 448px @ 16px, 392px @ 14px
// 36rem = 576px @ 16px, 504px @ 14px
c = c.replace(/min-h-\[400px\] xl:min-h-\[500px\]/g, 'min-h-[28rem] xl:min-h-[36rem]');

// max-w-[320px] -> max-w-[20rem] (320px)
c = c.replace(/max-w-\[320px\]/g, 'max-w-[20rem]');

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Converted arbitrary px to rem in login');
