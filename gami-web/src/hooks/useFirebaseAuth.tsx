import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';

import { isFirebaseConfigured } from '@/lib/firebase';
import { subscribeToAuth, signOutUser } from '@/lib/firebase-auth';

type FirebaseAuthContextValue = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  signOut: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!configured) return;
    return subscribeToAuth((next) => {
      setUser(next);
      setReady(true);
    });
  }, [configured]);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      ready,
      configured,
      user,
      signOut: async () => {
        await signOutUser();
      },
    }),
    [configured, ready, user],
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    return {
      ready: true,
      configured: false,
      user: null,
      signOut: async () => undefined,
    };
  }
  return ctx;
}
