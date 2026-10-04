const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// The main tables in laporan are standard HTML tables (table, thead, tbody, tr, td) and some use <Table> component.
// We will replace `text-sm` with `text-xs print:text-sm` inside the render block
// To avoid messing up the UI components outside #print-area, we only replace it inside the showPreview && ( ... ) block

let parts = c.split('{showPreview && (');
if (parts.length > 1) {
    let previewBlock = parts[1];
    
    // Replace text-sm with text-xs print:text-sm
    // But be careful not to double replace
    previewBlock = previewBlock.replace(/text-sm(?! print:text-sm)/g, 'text-xs print:text-sm');
    
    // Replace text-xs with text-[10px] print:text-xs
    previewBlock = previewBlock.replace(/text-xs(?! print:text-xs)/g, 'text-[10px] print:text-xs');
    
    // We can also reduce the padding from p-2 to p-1.5 print:p-2 in the tables
    previewBlock = previewBlock.replace(/p-2/g, 'p-1.5 print:p-2');
    
    // Rejoin
    c = parts[0] + '{showPreview && (' + previewBlock;
    fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
    console.log('Fixed laporan preview font sizes');
} else {
    console.log('Could not find showPreview block');
}
