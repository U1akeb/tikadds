import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6naArw-7OvvOjrMZWE2Bs7uS1dBQXjOw",
  authDomain: "tikadds-6a986.firebaseapp.com",
  projectId: "tikadds-6a986",
  storageBucket: "tikadds-6a986.firebasestorage.app",
  messagingSenderId: "988311941973",
  appId: "1:988311941973:web:072aaa938695202a70f5dc",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (typeof window !== "undefined") {
  void setPersistence(auth, browserLocalPersistence);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth, googleProvider };