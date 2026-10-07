const fs = require('fs');

// 1. Fix Issue B: Missing Label import in audit/page.tsx
let auditFile = fs.readFileSync('src/app/dashboard/audit/page.tsx', 'utf8');
if (!auditFile.includes('import { Label }')) {
  auditFile = auditFile.replace(
    'import { Button } from "@/components/ui/button";',
    'import { Button } from "@/components/ui/button";\nimport { Label } from "@/components/ui/label";'
  );
  fs.writeFileSync('src/app/dashboard/audit/page.tsx', auditFile);
  console.log('Fixed Label import in audit/page.tsx');
}

// 2. Fix Issue A: Restrict menus for auditor in layout.tsx
let layoutFile = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Change the condition for group 3: Manajemen Risiko
// From: if (user.role !== "admin") {
// To: if (user.role !== "admin" && user.role !== "auditor") {
layoutFile = layoutFile.replace(
  /if \(user\.role !== "admin"\) \{/g,
  'if (user.role !== "admin" && user.role !== "auditor") {'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', layoutFile);
console.log('Fixed layout.tsx auditor menus');

