const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const targetBlock = `    const totalSemuaRisiko = adminTotals.totalRisiko;
    const totalSemuaPrioritas = adminTotals.risikoPrioritas;
    const totalSemuaRtp = adminTotals.totalRtp;`;

const newBlock = `    const filteredRisksForDashboard = selectedChartUnit === "all" 
      ? allRisks 
      : allRisks.filter(r => r.unitName === selectedChartUnit);

    const displayTotals = selectedChartUnit === "all" 
      ? adminTotals 
      : {
          totalRisiko: filteredRisksForDashboard.length,
          risikoPrioritas: filteredRisksForDashboard.filter(r => (r.besaranRisiko || 0) >= 12).length,
          totalRtp: filteredRisksForDashboard.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0)
        };

    const totalSemuaRisiko = displayTotals.totalRisiko;
    const totalSemuaPrioritas = displayTotals.risikoPrioritas;
    const totalSemuaRtp = displayTotals.totalRtp;

    let displayHierarchy = adminHierarchy;
    if (selectedChartUnit !== "all") {
      displayHierarchy = adminHierarchy.filter(e1 => {
        return e1.name === selectedChartUnit || e1.children.some((c: any) => c.name === selectedChartUnit);
      }).map(e1 => {
        if (e1.name === selectedChartUnit) {
          return { ...e1, children: [] };
        }
        const filteredChildren = e1.children.filter((c: any) => c.name === selectedChartUnit);
        return { 
          ...e1, 
          children: filteredChildren,
          // Zero out E1's own numbers so its internal row doesn't show or shows zeros, 
          // but we actually want the parent row's totals to ONLY reflect the selected E2!
          totalRisiko: filteredChildren[0]?.totalRisiko || 0,
          risikoPrioritas: filteredChildren[0]?.risikoPrioritas || 0,
          totalRtp: filteredChildren[0]?.totalRtp || 0,
          e1OwnTotalRisiko: 0,
          e1OwnRisikoPrioritas: 0,
          e1OwnTotalRtp: 0
        };
      });
    }`;

c = c.replace(targetBlock, newBlock);

// Now we need to replace `adminHierarchy.map` with `displayHierarchy.map` in the table body.
// There is a line `{adminHierarchy.map(e1 => (` or similar inside the TableBody.

c = c.replace(/{adminHierarchy\.length === 0/g, '{displayHierarchy.length === 0');
c = c.replace(/{adminHierarchy\.map\(\(e1\)/g, '{displayHierarchy.map((e1)');
c = c.replace(/{adminHierarchy\.map\(e1 =>/g, '{displayHierarchy.map(e1 =>');

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Modified dashboard totals and hierarchy table filter');
