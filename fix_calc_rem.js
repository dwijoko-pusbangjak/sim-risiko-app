const fs = require('fs');
const glob = require('glob');
const path = require('path');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('page.tsx')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles('src/app/dashboard');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace calc(100vh-230px) to calc(100vh-14.5rem)
    if (content.includes('100vh-230px')) {
        content = content.replace(/100vh-230px/g, '100vh-14.5rem');
        modified = true;
    }
    // Replace calc(100vh-320px) to calc(100vh-20rem)
    if (content.includes('100vh-320px')) {
        content = content.replace(/100vh-320px/g, '100vh-20rem');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated px to rem in ${file}`);
    }
});
