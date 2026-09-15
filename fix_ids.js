const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  const snap = await db.collection('mr_identifikasi').get();
  let fixed = 0;
  for (const d of snap.docs) {
    if (d.data().id !== d.id) {
      console.log('Fixing doc', d.id, 'old id was', d.data().id);
      await d.ref.update({ id: d.id });
      fixed++;
    }
  }
  console.log('Fixed', fixed, 'documents.');
})();
