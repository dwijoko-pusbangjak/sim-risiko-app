const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/users/page.tsx', 'utf8');

c = c.replace(
  /<SelectItem value="admin">Administrator \(Pusat\)<\/SelectItem>/g,
  '<SelectItem value="admin">Administrator (Pusat)</SelectItem>\n<SelectItem value="pimpinan">Pimpinan Unit Kerja</SelectItem>'
);

c = c.replace(
  /case "eselon_2": return <span className="bg-emerald-100 text-emerald-800[^>]+>Eselon 2<\/span>;/g,
  '$&\n        case "pimpinan": return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-semibold">Pimpinan</span>;'
);

c = c.replace(
  /\{formData\.role === "admin" \? \(/g,
  '{formData.role === "admin" ? ('
);

// We need to change the unit selector logic.
// If role is pimpinan, they can choose either Eselon 1 or Eselon 2 unit.
// So we filter unitsList differently.
c = c.replace(
  /\{unitsList\.filter\(u => u\.level === formData\.role\)\.map/g,
  '{unitsList.filter(u => formData.role === "pimpinan" ? true : u.level === formData.role).map'
);

c = c.replace(
  /\{unitsList\.filter\(u => u\.level === formData\.role\)\.length === 0/g,
  '{unitsList.filter(u => formData.role === "pimpinan" ? true : u.level === formData.role).length === 0'
);

c = c.replace(
  /Pilih Unit \$\{formData\.role === 'eselon_1' \? 'Eselon 1' : 'Eselon 2'\}/g,
  'Pilih Unit ${formData.role === "pimpinan" ? "Kerja (Semua Level)" : formData.role === "eselon_1" ? "Eselon 1" : "Eselon 2"}'
);

fs.writeFileSync('src/app/dashboard/users/page.tsx', c);
console.log('Added pimpinan role to users page');
