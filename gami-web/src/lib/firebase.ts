import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { env } from '@/lib/env';

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

function readConfig() {
  const apiKey = env.firebaseApiKey();
  const authDomain = env.firebaseAuthDomain();
  const projectId = env.firebaseProjectId();
  const storageBucket = env.firebaseStorageBucket();
  const messagingSenderId = env.firebaseMessagingSenderId();
  const appId = env.firebaseAppId();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: storageBucket ?? `${projectId}.firebasestorage.app`,
    messagingSenderId: messagingSenderId ?? '869899204398',
    appId,
    ...(env.firebaseMeasurementId() ? { measurementId: env.firebaseMeasurementId() } : {}),
  };
}

let client: FirebaseClient | null | undefined;

/** Returns initialized Firebase services, or null when env is not configured. */
export function getFirebase(): FirebaseClient | null {
  if (client !== undefined) return client;

  const config = readConfig();
  if (!config) {
    client = null;
    return client;
  }

  const app = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  client = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return client;
}

export function isFirebaseConfigured(): boolean {
  return getFirebase() !== null;
}
