const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf-8');

c = c.replace(/function SelectTrigger\(\{[^]*?return \(\n\s*<SelectPrimitive\.Trigger\n\s*data-slot="select-trigger"\n\s*data-size=\{size\}\n\s*className=\{cn\(/, (match) => {
    return match.replace('<SelectPrimitive.Trigger', '<SelectPrimitive.Trigger style={{ width: "100%" }}');
});

c = c.replace(/<SelectPrimitive\.Popup\n\s*data-slot="select-content"\n\s*data-align-trigger=\{alignItemWithTrigger\}\n\s*className=\{cn\(/, (match) => {
    return match.replace('<SelectPrimitive.Popup', '<SelectPrimitive.Popup style={{ minWidth: "var(--anchor-width)", width: "max-content", maxWidth: "90vw" }}');
});

fs.writeFileSync('src/components/ui/select.tsx', c);
