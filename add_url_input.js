const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const targetStr = `<Label htmlFor="wallpaperFile">Upload Gambar Wallpaper</Label>`;
const newStr = `<Label htmlFor="wallpaperFile">Upload Gambar Wallpaper (Opsional)</Label>`;
c = c.replace(targetStr, newStr);

const urlInput = `
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">ATAU</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wallpaperUrl">Gunakan Tautan (URL) Gambar</Label>
              <Input 
                id="wallpaperUrl" 
                type="url"
                placeholder="https://contoh.com/gambar-wallpaper.jpg"
                value={!uploadFile ? wallpaperUrl : ""}
                onChange={(e) => {
                  setUploadFile(null);
                  setWallpaperUrl(e.target.value);
                  const fileInput = document.getElementById("wallpaperFile") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              />
              <p className="text-xs text-slate-500">
                Jika Firebase Storage terkunci, Anda bisa mengunggah gambar ke situs seperti Imgur/Postimages lalu menempelkan tautannya di sini.
              </p>
            </div>`;

c = c.replace(/(<p className="text-xs text-slate-500">\s*Kosongkan dan simpan jika ingin menggunakan warna solid\/gradien bawaan\.\s*<\/p>\s*<\/div>)/, `$1\n${urlInput}`);

fs.writeFileSync('src/app/dashboard/settings/page.tsx', c);
console.log('Modified src/app/dashboard/settings/page.tsx');
