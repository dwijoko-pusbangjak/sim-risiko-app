const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/sasaran-kegiatan/page.tsx', 'utf8');

const regexMap = /filteredData\.map\(\(item\) => \(\s*<TableRow key=\{item\.id\}>\s*(<TableCell className="font-medium text-slate-800">[\s\S]*?)<\/TableRow>\s*\)\)/;

const match = c.match(regexMap);
if (match) {
    console.log("Found map block!");
    let rowContent = match[1];

    // We need to inject rowSpan={group.length} into the first 2 (or 3 if admin) TableCells
    // and wrap them in {index === 0 && ( ... )}

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

    // The end of the admin cell is `</TableCell>\n                    )}`. We need to close the Fragment `</>` after it.
    rowContent = rowContent.replace(
        /<\/TableCell>\s*\)\}/,
        '</TableCell>\n                    )}\n                    </>)}'
    );

    const replacement = `Object.values(
                  filteredData.reduce((acc, item) => {
                    const key = \`\${item.name}-\${item.programId}-\${item.unitName}\`;
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
    fs.writeFileSync('src/app/dashboard/sasaran-kegiatan/page.tsx', c);
    console.log("Successfully replaced map in sasaran-kegiatan");
} else {
    console.log("Regex not matched");
}
