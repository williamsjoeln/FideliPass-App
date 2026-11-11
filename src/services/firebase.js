// Firebase Configuration for FideliPass Production
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "fidelipass-ec",
  appId: "1:500216284238:web:0551377d2c5f97a080ef1f",
  storageBucket: "fidelipass-ec.firebasestorage.app",
  apiKey: "AIzaSyDz75o3SD_wSaX-EvNZxOC44YYHTq16N7I",
  authDomain: "fidelipass-ec.firebaseapp.com",
  messagingSenderId: "500216284238",
  projectNumber: "500216284238"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { collection, doc, setDoc, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc };
