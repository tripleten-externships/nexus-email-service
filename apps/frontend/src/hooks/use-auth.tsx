import { useEffect, useState } from 'react';
import { auth } from '../utils/firebase';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { getAuthError } from '../utils/getAuthError';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    setAuthError(null);
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(result.user);
    } catch (error: any) {
      const code = error.code || 'Authentication failed';
      setAuthError(getAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error: any) {
      const code = error.code || 'Sign out failed';
      setAuthError(getAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return { currentUser, loading, signIn, signOut, authError };
};
