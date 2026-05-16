import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validation check
async function testConnection() {
  try {
    // Try to get a non-existent doc just to check connectivity
    await getDocFromServer(doc(db, '_internal', 'connectivity_check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Check your configuration or network.");
    } else {
      // It's fine if it fails with "permission denied" or "not found", we just want to see if we can reach the server
      console.log("Firebase connection test performed.");
    }
  }
}

testConnection();
