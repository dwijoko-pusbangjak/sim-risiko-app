const fs = require('fs');

function fixButtonType(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');
    c = c.replace(
      /<Button \n?\s*variant="outline" \n?\s*size="sm" \n?\s*onClick=\{([^}]+)\}\n?\s*>/g,
      '<Button type="button" variant="outline" size="sm" onClick={$1}>'
    );
    // Also catch inline ones
    c = c.replace(
      /<Button variant="outline" size="sm" onClick=\{([^}]+)\}>/g,
      '<Button type="button" variant="outline" size="sm" onClick={$1}>'
    );
    fs.writeFileSync(filepath, c);
    console.log('Fixed button type in ' + filepath);
}

fixButtonType('src/app/dashboard/sasaran-kegiatan/page.tsx');
fixButtonType('src/app/dashboard/sasaran-program/page.tsx');
fixButtonType('src/app/dashboard/sasaran-strategis/page.tsx');
