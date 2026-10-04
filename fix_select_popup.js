const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf8');

c = c.replace(
  'style={{ minWidth: "var(--anchor-width)", width: "max-content", maxWidth: "90vw" }}',
  'style={{ minWidth: "var(--anchor-width)", width: "var(--anchor-width)", maxWidth: "100%" }}'
);

c = c.replace(
  'min-w-(--anchor-width) w-max max-w-[800px]',
  'min-w-(--anchor-width) w-full'
);

fs.writeFileSync('src/components/ui/select.tsx', c);
console.log('Fixed select popup width');
