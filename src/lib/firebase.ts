import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJeTukvUSRzml35mTfqspTZxl6dHGSdq8",
  authDomain: "inspire-my-faith.firebaseapp.com",
  projectId: "inspire-my-faith",
  storageBucket: "inspire-my-faith.firebasestorage.app",
  messagingSenderId: "50459229305",
  appId: "1:50459229305:web:952f961691cf01c2e428a8",
  measurementId: "G-26Z9W232QD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithPopup, signOut };
