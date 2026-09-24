const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');
c = c.replace(/const \[sasaranList, setSasaranList\] = useState<any\[\]>\(\[\]\);/, 'const [sasaranList, setSasaranList] = useState<any[]>([]);\n  const [strategisList, setStrategisList] = useState<any[]>([]);\n  const [programList, setProgramList] = useState<any[]>([]);\n  const [kegiatanList, setKegiatanList] = useState<any[]>([]);');
const start = c.indexOf('if (reportType === "konteks") {');
const end = c.indexOf('// 2. Ambil data Risiko');
c = c.substring(0, start) + `if (reportType === "konteks") {
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
        ` + c.substring(end);
fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
