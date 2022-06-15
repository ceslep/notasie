import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBGvwT5dPKBcn8F8V2QXUsHIvOnaY_bc2A",
  authDomain: "app0-4f04c.firebaseapp.com",
  databaseURL: "https://app0-4f04c.firebaseio.com",
  projectId: "app0-4f04c",
  storageBucket: "app0-4f04c.appspot.com",
  messagingSenderId: "20124732333",
  appId: "1:20124732333:web:b1e680addf3d7b762b6f24"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);