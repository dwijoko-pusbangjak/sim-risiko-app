const fs = require('fs');

function fixReactImport(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');
    // Just blindly replace any `import { useState` that doesn't have React in it
    if (!c.includes('import React')) {
        c = c.replace(/import\s*\{\s*useState/g, 'import React, { useState');
        fs.writeFileSync(filepath, c);
        console.log('Fixed import in ' + filepath);
    } else {
        console.log('Import already correct in ' + filepath);
    }
}

fixReactImport('src/app/dashboard/sasaran-kegiatan/page.tsx');
fixReactImport('src/app/dashboard/sasaran-program/page.tsx');
fixReactImport('src/app/dashboard/sasaran-strategis/page.tsx');
