const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');
c = c.replace(/import \{ SearchCheck, Send, Inbox, useState, useEffect \} from "react";/, 'import { useState, useEffect } from "react";');
// And make sure they are NOT duplicated in lucide-react if they are
c = c.replace(/LayoutDashboard, SearchCheck, Send, Inbox, SearchCheck, Send, Inbox,/g, 'LayoutDashboard, SearchCheck, Send, Inbox,');

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Fixed imports');
