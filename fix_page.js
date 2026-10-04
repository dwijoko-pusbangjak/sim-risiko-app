const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Find the broken map function
const brokenMapStart = c.indexOf('{recentRisks.map((r) => {');
if (brokenMapStart !== -1) {
    // The previous script truncated this block. Let's replace the broken block with the correct one.
    // Let's find exactly where it breaks.
    const searchString = `                      <div className="shrink-0 pt-0.5">
                        <span className={\`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider \${styleInfo.badge}\`}>
                          {r.levelRisiko || "N/A"}
                        </span>
                      
      </div>
    </div>
  );
}`;

    const replaceString = `                      <div className="shrink-0 pt-0.5">
                        <span className={\`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider \${styleInfo.badge}\`}>
                          {r.levelRisiko || "N/A"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data risiko.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`;

    c = c.replace(searchString, replaceString);
    fs.writeFileSync('src/app/dashboard/page.tsx', c);
    console.log('Fixed syntax error in page.tsx');
} else {
    console.log('Could not find the target string');
}
