import { initializeApp } from 'firebase/app';  
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';  
const firebaseConfig = { apiKey: 'AIzaSyCY0d6RK0q9gRYnP_HB8nIzenFoUxD7BIQ', authDomain: 'sim-risiko-kemendes.firebaseapp.com', projectId: 'sim-risiko-kemendes', storageBucket: 'sim-risiko-kemendes.firebasestorage.app', messagingSenderId: '69317066510', appId: '1:69317066510:web:4d769c091ea4d377c4e15f'};  
const app = initializeApp(firebaseConfig); const db = getFirestore(app);  
async function clean() { const unitsSnap = await getDocs(collection(db, 'units')); const validUnits = new Set(); unitsSnap.forEach(d => validUnits.add(d.data().name));  
const risksSnap = await getDocs(collection(db, 'mr_identifikasi')); let count = 0;  
for (const d of risksSnap.docs) { const risk = d.data(); if (!validUnits.has(risk.unitName)) { console.log('Deleting risk: ' + d.id); await deleteDoc(doc(db, 'mr_identifikasi', d.id)); count++; } }  
console.log('Deleted ' + count + ' orphaned risks.'); process.exit(0); } clean();  
