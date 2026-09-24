const fs = require('fs');

const file = 'src/app/dashboard/laporan/page.tsx';
const content = fs.readFileSync(file, 'utf-8');
const newJsx = fs.readFileSync('laporan_konteks_jsx.txt', 'utf-8');

const startIdx = content.indexOf('{/* 5. LAPORAN PENETAPAN KONTEKS */}');
const endIdx = content.indexOf('{/* FOOTER TANDA TANGAN */}');

if (startIdx !== -1 && endIdx !== -1) {
    const startStr = content.substring(0, startIdx);
    const endStr = content.substring(endIdx);
    
    // We need to match the original structure, the existing code has `</div>\n\n          {/* FOOTER TANDA TANGAN */}`
    // Let's replace the whole chunk:
    const newContent = startStr + newJsx + '\\n          </div>\\n\\n          ' + endStr;
    
    fs.writeFileSync(file, newContent);
    console.log('Successfully replaced');
} else {
    console.log('Could not find markers');
}
