const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');

const newFetch = `      if (reportType === "konteks") {
        const kQ = query(collection(db, "mr_konteks"), where("unitName", "==", user.unitName), where("tahun", "==", activeYear));
        const kSnap = await getDocs(kQ);
        if (!kSnap.empty) {
          setKonteksData({ id: kSnap.docs[0].id, ...kSnap.docs[0].data() });
        } else {
          setKonteksData(null);
        }
        
        const stQ = collection(db, "sasaran_strategis");
        const stSnap = await getDocs(stQ);
        const allStrategis = stSnap.docs.map(d => ({id: d.id, ...d.data()}));
        
        if (uDataLevel === "eselon_1") {
          const progQ = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
          const progSnap = await getDocs(progQ);
          const programs = progSnap.docs.map(d => ({id: d.id, ...d.data()}));
          
          const parentStrategisIds = [...new Set(programs.map(p => p.strategisId))];
          const filteredStrategis = allStrategis.filter(s => parentStrategisIds.includes(s.id));
          
          setStrategisList(filteredStrategis);
          setProgramList(programs);
          setSasaranList(programs);
          setParentSasaranList(filteredStrategis);
          setKegiatanList([]);
        } else if (uDataLevel === "eselon_2") {
          const kegQ = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
          const kegSnap = await getDocs(kegQ);
          const kegiatans = kegSnap.docs.map(d => ({id: d.id, ...d.data()}));
          
          const progSnap = await getDocs(collection(db, "sasaran_program"));
          const allPrograms = progSnap.docs.map(d => ({id: d.id, ...d.data()}));
          
          const parentProgramIds = [...new Set(kegiatans.map(k => k.programId))];
          const filteredPrograms = allPrograms.filter(p => parentProgramIds.includes(p.id));
          
          const parentStrategisIds = [...new Set(filteredPrograms.map(p => p.strategisId))];
          const filteredStrategis = allStrategis.filter(s => parentStrategisIds.includes(s.id));
          
          setStrategisList(filteredStrategis);
          setProgramList(filteredPrograms);
          setKegiatanList(kegiatans);
          setSasaranList(kegiatans);
          setParentSasaranList(filteredPrograms);
        }
      } else {`;

const startFetch = '      if (reportType === "konteks") {';
const endFetch = '      } else {\n          // 2. Ambil data Risiko';
const startIdx = c.indexOf(startFetch);
let endIdx = c.indexOf(endFetch, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  c = c.substring(0, startIdx) + newFetch + c.substring(endIdx + 14); // len of '} else {'
  fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find blocks.");
}
