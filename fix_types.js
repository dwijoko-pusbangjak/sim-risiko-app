const fs = require('fs');
const files = ['src/app/dashboard/units/page.tsx', 'src/app/dashboard/users/page.tsx', 'src/app/login/page.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/onValueChange=\{\(val\)/g, 'onValueChange={(val: any)');
  content = content.replace(/const handleRoleChange = \(newRole: string\)/g, 'const handleRoleChange = (newRole: any)');
  fs.writeFileSync(f, content);
});
