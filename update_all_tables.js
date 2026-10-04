const fs = require('fs');
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
    if (file.includes('laporan/page.tsx')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    const regex = /className="([^"]*overflow-x-auto[^"]*)"/g;
    
    content = content.replace(regex, (match, p1) => {
        if (p1.includes('max-h-')) return match; 
        
        let newClasses = p1.replace('overflow-x-auto', 'overflow-auto max-h-[calc(100vh-230px)] relative');
        
        if (!newClasses.includes('custom-scrollbar')) {
            newClasses += ' custom-scrollbar';
        }
        modified = true;
        return `className="${newClasses}"`;
    });

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
