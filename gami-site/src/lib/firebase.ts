import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const DEFAULT_FIREBASE = {
  apiKey: 'AIzaSyAmH2y1bsVUDvBwaTkzh10lcSNPeafaMJI',
  authDomain: 'gami-protocol.firebaseapp.com',
  projectId: 'gami-protocol',
  storageBucket: 'gami-protocol.firebasestorage.app',
  messagingSenderId: '476154037926',
  appId: '1:476154037926:web:124de45220907b40ec5667',
} as const;

function readPublic(value: string | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readConfig() {
  // Direct NEXT_PUBLIC_* access so Next.js can inline these at build time.
  const apiKey = readPublic(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ?? DEFAULT_FIREBASE.apiKey;
  const authDomain =
    readPublic(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ?? DEFAULT_FIREBASE.authDomain;
  const projectId =
    readPublic(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ?? DEFAULT_FIREBASE.projectId;
  const storageBucket =
    readPublic(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ?? DEFAULT_FIREBASE.storageBucket;
  const messagingSenderId =
    readPublic(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ??
    DEFAULT_FIREBASE.messagingSenderId;
  const appId = readPublic(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ?? DEFAULT_FIREBASE.appId;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export type FirebaseClient = {
  app: FirebaseApp;
  db: Firestore;
};

let client: FirebaseClient | null | undefined;

export function getFirebase(): FirebaseClient | null {
  if (client !== undefined) return client;

  const config = readConfig();
  if (!config) {
    client = null;
    return client;
  }

  const app = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  client = { app, db: getFirestore(app) };
  return client;
}

export function isFirebaseConfigured(): boolean {
  return getFirebase() !== null;
}
