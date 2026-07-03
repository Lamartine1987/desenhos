import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpTTy_ur-W06952Sy1CwRnlrhZpD_YxXc",
  authDomain: "sistema-desenhos.firebaseapp.com",
  projectId: "sistema-desenhos",
  storageBucket: "sistema-desenhos.firebasestorage.app",
  messagingSenderId: "167443466209",
  appId: "1:167443466209:web:47f949ec6c9064c12974a0",
  measurementId: "G-7LXYV6TZZ8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
