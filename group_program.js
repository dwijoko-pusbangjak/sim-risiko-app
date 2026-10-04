const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/sasaran-program/page.tsx', 'utf8');

const regexMap = /filteredData\.map\(\(item\) => \(\s*<TableRow key=\{item\.id\}>\s*(<TableCell className="font-medium text-slate-800">[\s\S]*?)<\/TableRow>\s*\)\)/;

const match = c.match(regexMap);
if (match) {
    let rowContent = match[1];

    rowContent = rowContent.replace(
        /<TableCell className="font-medium text-slate-800">/,
        '{index === 0 && (<>\n                    <TableCell rowSpan={group.length} className="font-medium text-slate-800 align-top">'
    );

    rowContent = rowContent.replace(
        /<TableCell className="text-slate-500 text-xs leading-relaxed">/,
        '<TableCell rowSpan={group.length} className="text-slate-500 text-xs leading-relaxed align-top">'
    );

    // Admin cell
    rowContent = rowContent.replace(
        /\{user\.role === "admin" && \(\s*<TableCell>/,
        '{user.role === "admin" && (\n                      <TableCell rowSpan={group.length} className="align-top">'
    );

    // Close Fragment
    rowContent = rowContent.replace(
        /<\/TableCell>\s*\)\}/,
        '</TableCell>\n                    )}\n                    </>)}'
    );

    const replacement = `Object.values(
                  filteredData.reduce((acc, item) => {
                    const key = \`\${item.name}-\${item.strategisId}-\${item.unitName}\`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                  }, {} as Record<string, typeof filteredData>)
                ).map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    {group.map((item, index) => (
                      <TableRow key={item.id}>
                        ${rowContent}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))`;

    c = c.replace(regexMap, replacement);
    c = c.replace('import { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";');
    fs.writeFileSync('src/app/dashboard/sasaran-program/page.tsx', c);
    console.log("Successfully replaced map in sasaran-program");
} else {
    console.log("Regex not matched in sasaran-program");
}
