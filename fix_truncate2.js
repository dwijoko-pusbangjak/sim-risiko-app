const fs = require('fs');

function fixFile(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');
    c = c.replace(
      /<span className="truncate text-left w-full">/g,
      '<span className="line-clamp-3 break-words text-left flex-1 min-w-0">'
    );
    c = c.replace(
      /<span className="truncate">/g,
      '<span className="line-clamp-3 break-words text-left flex-1 min-w-0">'
    );
    fs.writeFileSync(filepath, c);
    console.log('Fixed ' + filepath);
}

fixFile('src/app/dashboard/sasaran-program/page.tsx');
fixFile('src/app/dashboard/mr-identifikasi/page.tsx');
