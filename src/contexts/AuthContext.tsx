import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Magic Link Sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            // Remove the token from the URL so it doesn't try to log them in again
            window.history.replaceState(null, '', window.location.pathname);
          })
          .catch((error) => {
            console.error('Error signing in with email link', error);
            alert('This link is invalid or has expired. Please request a new one.');
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If user requires verification but hasn't verified, we might still want to let them be 'user', 
      // but UI will handle showing a "Please verify your email" screen.
      setUser(user);
      setLoading(false);
      
      // Perform Magic Sync if user just logged in and is fully verified or Google
      if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
        syncLocalData(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  const syncLocalData = async (userId: string) => {
    try {
      // Sync Prayers
      const localPrayers = localStorage.getItem('imf_prayers');
      if (localPrayers) {
        const prayers = JSON.parse(localPrayers);
        for (const prayer of prayers) {
          await fetch('/api/user/prayers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, prayer })
          });
        }
        localStorage.removeItem('imf_prayers');
        console.log("Synced prayers from local storage");
      }
      
      // We can add sync logic for Sermon Notes, Reading Plans, etc. here
      
    } catch (error) {
      console.error("Error during local data sync:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site or open it in a standard browser (like Safari or Chrome).');
      } else if (error.message && error.message.includes('403')) {
        alert('Google Sign-In Error (403). If you are opening this link from an email or messaging app, please tap the menu (three dots) and choose "Open in System Browser" (Safari/Chrome).');
      } else {
        alert(`Sign in failed: ${error.message || 'Unknown error'}\n\nIf you are in an app browser (like Gmail or Facebook), try opening the link in regular Safari/Chrome.`);
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Immediately send verification email
      await sendEmailVerification(userCredential.user);
    } catch (error: any) {
      console.error('Error signing up', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing in', error);
      throw error;
    }
  };

  const sendMagicLink = async (email: string) => {
    const actionCodeSettings = {
      // URL you want to redirect back to
      url: 'https://inspiremyfaith.com',
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      console.error('Error sending magic link', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error: any) {
        console.error('Error resending verification', error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithGoogle, 
      signUpWithEmail, signInWithEmail, sendMagicLink, resendVerificationEmail, 
      signOut 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
