const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', 'utf8');

c = c.replace(/} catch \(error\) \{/g, '} catch (error: any) {');
c = c.replace(/console\.error\("Check status error", error\);/g, 'console.error("Check status error", error); toast.error("Debug Error: " + (error?.message || "unknown")); setRiskCount(999);');

fs.writeFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', c);
console.log('Injected debug');
