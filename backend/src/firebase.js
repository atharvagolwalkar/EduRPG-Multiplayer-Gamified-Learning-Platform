import admin from 'firebase-admin';
import process from 'process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve('./serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.warn('⚠️  serviceAccountKey.json not found. Using environment variables.');
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export const db = admin.firestore();
export const realtimeDb = admin.database();
export const auth = admin.auth();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });

export default admin;
