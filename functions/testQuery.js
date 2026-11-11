// functions/testQuery.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('../google-service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function run() {
  try {
    console.log("Checking query...");
    const snap = await db.collection('notifications').where('businessId', '==', 'mc-rolls').orderBy('createdAt', 'desc').limit(1).get();
    console.log('Query succeeded! Found:', snap.size);
    if (!snap.empty) console.log(snap.docs[0].data());
  } catch(e) {
    console.error('FAILED QUERY:', e.message);
  }
}
run();
