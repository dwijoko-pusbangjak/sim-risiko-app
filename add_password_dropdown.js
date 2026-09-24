const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  /<DropdownMenuSeparator className="my-1" \/>/,
  `<DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer rounded-lg mb-1">
                    <KeyRound className="mr-2 h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-700">Ubah Password</span>
                  </DropdownMenuItem>`
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Modified layout.tsx for dropdown item');
