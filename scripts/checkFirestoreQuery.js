// scripts/checkFirestoreQuery.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/google-service-account.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  try {
    console.log("Checking query...");
    const snap = await db.collection('notifications')
      .where('businessId', '==', 'mc-rolls')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    console.log("Success! Found:", snap.size);
    if (!snap.empty) {
      console.log("Data:", snap.docs[0].data());
    }
  } catch (err) {
    console.error("Firestore query error:", err.message);
  }
}
check();
