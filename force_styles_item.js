const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf-8');

c = c.replace(/<SelectPrimitive\.ItemText className=/g, '<SelectPrimitive.ItemText style={{ whiteSpace: "normal", wordBreak: "break-word" }} className=');

fs.writeFileSync('src/components/ui/select.tsx', c);
