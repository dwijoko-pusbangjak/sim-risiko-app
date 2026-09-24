const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  `import { useAuth } from "@/context/AuthContext";`,
  `import { useAuth } from "@/context/AuthContext";\nimport { ChangePasswordModal } from "@/components/ChangePasswordModal";\nimport { KeyRound } from "lucide-react";`
);

c = c.replace(
  `const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Proses Manajemen Risiko": true });`,
  `const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Proses Manajemen Risiko": true });\n  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);`
);

const oldDropdown = `<DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-medium">Keluar dari Sistem</span>
                  </DropdownMenuItem>`;

const newDropdown = `<DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer rounded-lg mb-1">
                    <KeyRound className="mr-2 h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-700">Ubah Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-medium">Keluar dari Sistem</span>
                  </DropdownMenuItem>`;

c = c.replace(oldDropdown, newDropdown);

const oldMain = `<main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] relative">`;
const newMain = `<ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />\n          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] relative">`;
c = c.replace(oldMain, newMain);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Modified layout.tsx');
