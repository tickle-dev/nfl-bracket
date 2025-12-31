import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!auth) {
      setError('Firebase not configured. Please add .env file with Firebase credentials.');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email) : false);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        } else {
          setUsername(user.displayName || user.email.split('@')[0]);
        }
      } else {
        setUsername(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    if (!auth) throw new Error('Firebase not configured');
    return signInWithEmailAndPassword(auth, email, password);
  };
  
  const signup = async (email, password, username) => {
    if (!auth) throw new Error('Firebase not configured');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    
    const isAdminUser = ADMIN_EMAILS.includes(email);
    
    await setDoc(doc(db, 'users', result.user.uid), {
      username,
      email,
      isAdmin: isAdminUser,
      createdAt: new Date(),
      emailVerified: false
    });
    await sendEmailVerification(result.user);
    return result;
  };
  
  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const isAdminUser = ADMIN_EMAILS.includes(result.user.email);
    
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        username: result.user.displayName || result.user.email.split('@')[0],
        email: result.user.email,
        isAdmin: isAdminUser,
        createdAt: new Date()
      });
    }
    
    return result;
  };
  
  const logout = () => {
    if (!auth) throw new Error('Firebase not configured');
    return signOut(auth);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Configuration Required</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="bg-gray-100 p-4 rounded text-sm">
            <p className="font-semibold mb-2">Quick Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create Firebase project at console.firebase.google.com</li>
              <li>Enable Authentication (Email/Password)</li>
              <li>Create Firestore database</li>
              <li>Copy .env.example to .env</li>
              <li>Add your Firebase credentials to .env</li>
              <li>Restart dev server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, loading, isAdmin, username }}>
      {children}
    </AuthContext.Provider>
  );
};
