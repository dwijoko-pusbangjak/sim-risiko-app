const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Add imports
if (!c.includes('DashboardCharts')) {
  c = c.replace(
    'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";',
    'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";\nimport { DashboardCharts } from "@/components/DashboardCharts";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";'
  );
}

// Add state
if (!c.includes('const [allRisks, setAllRisks]')) {
  c = c.replace(
    'const [adminTotals, setAdminTotals] = useState({ totalRisiko: 0, risikoPrioritas: 0, totalRtp: 0 });',
    'const [adminTotals, setAdminTotals] = useState({ totalRisiko: 0, risikoPrioritas: 0, totalRtp: 0 });\n  const [allRisks, setAllRisks] = useState<IdentifikasiRisiko[]>([]);\n  const [selectedChartUnit, setSelectedChartUnit] = useState<string>("all");'
  );
}

// Modify fetchAdminData to save allRisks safely
const targetBlock = `      const initialExpand: Record<string, boolean> = {};
      hierarchy.forEach(h => initialExpand[h.id] = true);
      setExpandedE1(initialExpand);
      
      setAdminHierarchy(hierarchy);`;

const replacementBlock = `      const initialExpand: Record<string, boolean> = {};
      hierarchy.forEach(h => initialExpand[h.id] = true);
      setExpandedE1(initialExpand);
      
      // Save only risks that belong to this hierarchy
      const visibleRisks = allRisks.filter(r => mappedRiskIds.has(r.id));
      setAllRisks(visibleRisks);
      
      setAdminHierarchy(hierarchy);`;

c = c.replace(targetBlock, replacementBlock);

// Render logic
const renderTarget = `{/* Kartu Ringkasan Admin */}`;
const renderReplacement = `
        {/* DROPDOWN FILTER & CHARTS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Visualisasi & Rekapitulasi Risiko</h3>
              <p className="text-sm text-slate-500">Pilih unit kerja untuk melihat grafik distribusinya.</p>
            </div>
            <div className="w-full md:w-[350px]">
              <Select value={selectedChartUnit} onValueChange={setSelectedChartUnit}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-300">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">Semua Unit (Konsolidasi)</SelectItem>
                  {adminHierarchy.map(e1 => (
                    <div key={e1.id}>
                      <SelectItem value={e1.name} className="font-semibold text-blue-700">UKE I - {e1.name}</SelectItem>
                      {e1.children.map((e2: any) => (
                        <SelectItem key={e2.id} value={e2.name} className="pl-8 text-slate-700">UKE II - {e2.name}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DashboardCharts 
            risks={selectedChartUnit === "all" ? allRisks : allRisks.filter(r => r.unitName === selectedChartUnit)} 
          />
        </div>

        {/* Kartu Ringkasan Admin */}`;

c = c.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Modified dashboard with charts');
