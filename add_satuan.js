const fs = require('fs');

const files = [
  'src/app/dashboard/sasaran-strategis/page.tsx',
  'src/app/dashboard/sasaran-program/page.tsx',
  'src/app/dashboard/sasaran-kegiatan/page.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  
  // 1. Add satuan to interface
  c = c.replace(/interface Indikator \{\s*name: string;\s*target: string;\s*\}/g,
                'interface Indikator {\n  name: string;\n  target: string;\n  satuan?: string;\n}');
                
  // 2. Add satuan to default values (might appear multiple times, e.g. [{ name: "", target: "" }])
  c = c.replace(/\{ name: "", target: "" \}/g, '{ name: "", target: "", satuan: "" }');
  
  // 3. Update legacy fallback
  // { name: item.iku || "", target: item.target || "" }
  c = c.replace(/\{ name: item\.iku \|\| "", target: item\.target \|\| "" \}/g, 
                '{ name: item.iku || "", target: item.target || "", satuan: "" }');
  // { name: item.ikp || "", target: item.target || "" }
  c = c.replace(/\{ name: item\.ikp \|\| "", target: item\.target \|\| "" \}/g, 
                '{ name: item.ikp || "", target: item.target || "", satuan: "" }');
  // { name: item.ikk || "", target: item.target || "" }
  c = c.replace(/\{ name: item\.ikk \|\| "", target: item\.target \|\| "" \}/g, 
                '{ name: item.ikk || "", target: item.target || "", satuan: "" }');

  // 4. Update the render in the table
  c = c.replace(/\{ind\.target\}\s*<\/span>/g, '{ind.target} {ind.satuan || ""}\n                              </span>');
  
  // 5. Update the modal input fields
  // Currently looks like:
  // <div className="grid gap-1.5 pr-8">
  //   <Label className="text-xs">Target {index + 1} *</Label>
  //   <Input 
  //     required
  //     placeholder="Contoh: 100" 
  //     value={ind.target}
  //     onChange={(e) => {
  //       const newInds = [...formData.indikators!];
  //       newInds[index].target = e.target.value;
  //       setFormData({...formData, indikators: newInds});
  //     }}
  //   />
  // </div>
  // We want to change the target div to grid-cols-2 and add satuan.
  
  const targetInputRegex = /<div className="grid gap-1\.5 pr-8">\s*<Label className="text-xs">Target \{index \+ 1\} \*<\/Label>\s*<Input\s*required[\s\S]*?onChange=\{\(e\) => \{\s*const newInds = \[\.\.\.formData\.indikators!\];\s*newInds\[index\]\.target = e\.target\.value;\s*setFormData\(\{\.\.\.formData, indikators: newInds\}\);\s*\}\}\s*\/>\s*<\/div>/;

  c = c.replace(targetInputRegex, (match) => {
    // extract placeholder
    let placeholderMatch = match.match(/placeholder="([^"]*)"/);
    let placeholder = placeholderMatch ? placeholderMatch[0] : '';
    
    return `<div className="grid grid-cols-2 gap-3 pr-8">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Target {index + 1} *</Label>
                          <Input 
                            required
                            ${placeholder}
                            value={ind.target}
                            onChange={(e) => {
                              const newInds = [...formData.indikators!];
                              newInds[index].target = e.target.value;
                              setFormData({...formData, indikators: newInds});
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Satuan *</Label>
                          <Input 
                            required
                            placeholder="Satuan (Cth: Dokumen)"
                            value={ind.satuan || ""}
                            onChange={(e) => {
                              const newInds = [...formData.indikators!];
                              newInds[index].satuan = e.target.value;
                              setFormData({...formData, indikators: newInds});
                            }}
                          />
                        </div>
                      </div>`;
  });
  
  fs.writeFileSync(f, c);
  console.log('Modified', f);
});
