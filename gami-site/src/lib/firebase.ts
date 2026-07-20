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

function read(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readConfig() {
  const apiKey = read('NEXT_PUBLIC_FIREBASE_API_KEY') ?? DEFAULT_FIREBASE.apiKey;
  const authDomain = read('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? DEFAULT_FIREBASE.authDomain;
  const projectId = read('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? DEFAULT_FIREBASE.projectId;
  const storageBucket =
    read('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? DEFAULT_FIREBASE.storageBucket;
  const messagingSenderId =
    read('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ?? DEFAULT_FIREBASE.messagingSenderId;
  const appId = read('NEXT_PUBLIC_FIREBASE_APP_ID') ?? DEFAULT_FIREBASE.appId;

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
