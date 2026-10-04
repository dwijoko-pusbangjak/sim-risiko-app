const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Find the start of the Area Konten Tambahan block
const startMarker = '{/* Area Konten Tambahan */}';
const startIdx = c.indexOf(startMarker);
if (startIdx === -1) {
    console.log("Could not find start marker");
    process.exit(1);
}

// Replace the entire block starting from Area Konten Tambahan to the end of the return statement
// We'll replace it using regex to match the old charts but keep the Risiko Terkini
// Actually, it's easier to just slice the string up to startMarker, and append the new content.

const oldContentBefore = c.substring(0, startIdx);

// I need to preserve the Risiko Terkini card!
// Let's extract the Risiko Terkini card using regex.
const risksRegex = /\{\/\* Daftar Risiko Terbaru \*\/\}[\s\S]*?(?=<\/div>\s*<\/div>\s*\);)/;
const match = c.match(risksRegex);

let newEnd = `      {/* Area Konten Tambahan */}
      <div className="mt-8">
        <DashboardCharts risks={data} />
      </div>

      <div className="grid gap-6 mt-6">
        ${match ? match[0] : ''}
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/app/dashboard/page.tsx', oldContentBefore + newEnd);
console.log('Replaced Eselon 2 charts with DashboardCharts component');
