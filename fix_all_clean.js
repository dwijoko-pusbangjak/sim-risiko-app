const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');

// 1. Fix states
c = c.replace(/const \[sasaranList, setSasaranList\] = useState<any\[\]>\(\[\]\);/,
`const [sasaranList, setSasaranList] = useState<any[]>([]);
  const [strategisList, setStrategisList] = useState<any[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);`);

// 2. Fix fetch
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
        setStrategisList(stSnap.docs.map(d => ({id: d.id, ...d.data()})));
        
        if (uDataLevel === "eselon_1") {
          const progQ = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
          const progSnap = await getDocs(progQ);
          const programs = progSnap.docs.map(d => ({id: d.id, ...d.data()}));
          setProgramList(programs);
          setSasaranList(programs);
          setParentSasaranList(stSnap.docs.map(d => ({id: d.id, ...d.data()})));
          setKegiatanList([]);
        } else if (uDataLevel === "eselon_2") {
          const progSnap = await getDocs(collection(db, "sasaran_program"));
          const programs = progSnap.docs.map(d => ({id: d.id, ...d.data()}));
          setProgramList(programs);
          setParentSasaranList(programs);

          const kegQ = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
          const kegSnap = await getDocs(kegQ);
          const kegiatans = kegSnap.docs.map(d => ({id: d.id, ...d.data()}));
          setKegiatanList(kegiatans);
          setSasaranList(kegiatans);
        }
      } else {
          // 2. Ambil data Risiko`;

const startFetch = '      if (reportType === "konteks") {';
const endFetch = '      } else {\n          // 2. Ambil data Risiko';
const startIdx = c.indexOf(startFetch);
let endIdx = c.indexOf(endFetch, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  c = c.substring(0, startIdx) + newFetch + c.substring(endIdx + endFetch.length);
  fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
  console.log("Replaced correctly!");
} else {
  console.log("Not found block!");
}
