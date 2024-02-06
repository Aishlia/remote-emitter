// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCIKIgcg6TUD4VorgWkA1uzFIDt8z6mB4",
  authDomain: "remote-emitter.firebaseapp.com",
  projectId: "remote-emitter",
  storageBucket: "remote-emitter.appspot.com",
  messagingSenderId: "882888276315",
  appId: "1:882888276315:web:6b9e2fc58574651c8b027e",
  measurementId: "G-RTEFJ03B7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };