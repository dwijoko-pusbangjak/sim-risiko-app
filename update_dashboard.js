const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add viewMode state
c = c.replace(
  'const [isLoading, setIsLoading] = useState(true);',
  'const [isLoading, setIsLoading] = useState(true);\n  const [viewMode, setViewMode] = useState<"admin" | "eselon_1" | "eselon_2">("eselon_2");'
);

// 2. Modify useEffect
const oldUseEffect = `  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        fetchAdminData();
      } else {
        fetchDashboardData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);`;

const newUseEffect = `  useEffect(() => {
    const init = async () => {
      if (!authLoading && user) {
        if (user.role === "admin") {
          setViewMode("admin");
          fetchAdminData("admin", "");
        } else {
          try {
            const uq = query(collection(db, "units"), where("name", "==", user.unitName));
            const snap = await getDocs(uq);
            let isE1 = false;
            if (!snap.empty) {
              isE1 = snap.docs[0].data().level === "eselon_1";
            }
            if (isE1) {
              setViewMode("eselon_1");
              fetchAdminData("eselon_1", user.unitName);
            } else {
              setViewMode("eselon_2");
              fetchDashboardData();
            }
          } catch (e) {
            setViewMode("eselon_2");
            fetchDashboardData();
          }
        }
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);`;

c = c.replace(oldUseEffect, newUseEffect);

// 3. Modify fetchAdminData
// We will replace the entire fetchAdminData block
const fetchAdminDataRegex = /const fetchAdminData = async \(\) => \{[\s\S]*?(?=const fetchDashboardData = async)/;

const newFetchAdminData = `const fetchAdminData = async (mode = "admin", specificUnitName = "") => {
    setIsLoading(true);
    try {
      const safeYear = activeYear || new Date().getFullYear().toString();
      
      const snapUnits = await getDocs(collection(db, "units"));
      const allUnits = snapUnits.docs.map(doc => ({ ...doc.data(), id: doc.id } as Unit));
      
      const qRisks = query(collection(db, "mr_identifikasi"), where("tahun", "==", safeYear));
      const snapRisks = await getDocs(qRisks);
      const allRisks = snapRisks.docs.map(doc => ({ ...doc.data(), id: doc.id } as IdentifikasiRisiko));
      
      const risksByUnit: Record<string, IdentifikasiRisiko[]> = {};
      allRisks.forEach(r => {
        const unitNameKey = r.unitName || "Tidak Diketahui";
        if (!risksByUnit[unitNameKey]) risksByUnit[unitNameKey] = [];
        risksByUnit[unitNameKey].push(r);
      });
      
      let eselon1Units = allUnits.filter(u => u.level === "eselon_1");
      if (mode === "eselon_1") {
         eselon1Units = eselon1Units.filter(u => u.name === specificUnitName);
      }
      const eselon2Units = allUnits.filter(u => u.level === "eselon_2");
      
      const mappedRiskIds = new Set<string>();

      const hierarchy = eselon1Units.map(e1 => {
        const children = eselon2Units.filter(e2 => e2.parentId === e1.id);
        
        const e1Risks = risksByUnit[e1.name] || [];
        e1Risks.forEach(r => mappedRiskIds.add(r.id));
        
        const e1OwnTotalRisiko = e1Risks.length;
        const e1OwnRisikoPrioritas = e1Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
        const e1OwnTotalRtp = e1Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
        
        let totalRisiko = e1OwnTotalRisiko;
        let risikoPrioritas = e1OwnRisikoPrioritas;
        let totalRtp = e1OwnTotalRtp;
        
        const childrenData = children.map(e2 => {
          const e2Risks = risksByUnit[e2.name] || [];
          e2Risks.forEach(r => mappedRiskIds.add(r.id));
          
          const e2Total = e2Risks.length;
          const e2Prioritas = e2Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
          const e2Rtp = e2Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
          
          totalRisiko += e2Total;
          risikoPrioritas += e2Prioritas;
          totalRtp += e2Rtp;
          
          return {
            ...e2,
            totalRisiko: e2Total,
            risikoPrioritas: e2Prioritas,
            totalRtp: e2Rtp
          };
        });
        
        return {
          ...e1,
          totalRisiko,
          risikoPrioritas,
          totalRtp,
          e1OwnTotalRisiko,
          e1OwnRisikoPrioritas,
          e1OwnTotalRtp,
          children: childrenData
        };
      });
      
      let tRisiko = 0;
      let tPrioritas = 0;
      let tRtp = 0;
      hierarchy.forEach(h => {
         tRisiko += h.totalRisiko;
         tPrioritas += h.risikoPrioritas;
         tRtp += h.totalRtp;
      });
      setAdminTotals({ totalRisiko: tRisiko, risikoPrioritas: tPrioritas, totalRtp: tRtp });
      
      if (mode === "admin") {
        const unmappedRisks = allRisks.filter(r => !mappedRiskIds.has(r.id));
        if (unmappedRisks.length > 0) {
          Promise.all(unmappedRisks.map(r => deleteDoc(doc(db, "mr_identifikasi", r.id))))
            .catch(e => console.error(e));
        }
      }
      
      const initialExpand: Record<string, boolean> = {};
      hierarchy.forEach(h => initialExpand[h.id] = true);
      setExpandedE1(initialExpand);
      
      setAdminHierarchy(hierarchy);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  `;

c = c.replace(fetchAdminDataRegex, newFetchAdminData);

// 4. Modify render block condition and title
c = c.replace(
  'if (user?.role === "admin") {',
  'if (viewMode === "admin" || viewMode === "eselon_1") {'
);

c = c.replace(
  '<h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Konsolidasi Nasional</h2>',
  '<h2 className="text-3xl font-bold tracking-tight text-slate-900">{viewMode === "admin" ? "Dashboard Konsolidasi Nasional" : "Dashboard Konsolidasi Eselon 1"}</h2>'
);

c = c.replace(
  '<p className="text-slate-500 mt-1">Gabungan profil risiko dari seluruh unit kerja Eselon 1 dan Eselon 2 di Tahun {activeYear}.</p>',
  '<p className="text-slate-500 mt-1">{viewMode === "admin" ? "Gabungan profil risiko dari seluruh unit kerja Eselon 1 dan Eselon 2" : "Gabungan profil risiko dari unit kerja Anda dan Eselon 2 di bawahnya"} di Tahun {activeYear}.</p>'
);

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Modified dashboard logic');
