const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/users/page.tsx', 'utf8');

c = c.replace(
  /<SelectItem value="admin">Administrator \(Pusat\)<\/SelectItem>/g,
  '<SelectItem value="admin">Administrator (Pusat)</SelectItem>\n                      <SelectItem value="auditor">Auditor (APIP)</SelectItem>'
);

c = c.replace(
  /case "admin": return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-bold">Admin<\/span>;/g,
  'case "admin": return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-bold">Admin</span>;\n      case "auditor": return <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-md text-xs font-bold">Auditor</span>;'
);

c = c.replace(
  /formData.role === "admin"/g,
  '(formData.role === "admin" || formData.role === "auditor")'
);

c = c.replace(
  /user.role === "admin"/g,
  '(user.role === "admin" || user.role === "auditor")'
);

fs.writeFileSync('src/app/dashboard/users/page.tsx', c);
console.log('Added auditor role to users page');
