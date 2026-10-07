const fs = require('fs');
['src/app/dashboard/proses-audit/kirim/page.tsx', 'src/app/dashboard/proses-audit/inbox/page.tsx', 'src/app/dashboard/audit/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  
  if (!c.includes('const safeYear = activeYear || new Date().getFullYear().toString();')) {
    // Insert safeYear inside fetch blocks
    c = c.replace(/checkStatus = async \(\) => \{/g, 'checkStatus = async () => {\n    const safeYear = activeYear || new Date().getFullYear().toString();');
    c = c.replace(/fetchInbox = async \(\) => \{/g, 'fetchInbox = async () => {\n    const safeYear = activeYear || new Date().getFullYear().toString();');
    c = c.replace(/handleFetchRisks = async \(\) => \{/g, 'handleFetchRisks = async () => {\n    const safeYear = activeYear || new Date().getFullYear().toString();');
    
    // Replace activeYear with safeYear in query
    c = c.replace(/where\("tahun", "==", activeYear\)/g, 'where("tahun", "==", safeYear)');
  }
  
  fs.writeFileSync(file, c);
});
console.log('Fixed safeYear');
