import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDELrjtBED0WgrTMht66is9Fcd01na3vmQ',
  authDomain: 'notwins2-a7fe7.firebaseapp.com',
  projectId: 'notwins2-a7fe7',
  storageBucket: 'notwins2-a7fe7.appspot.com',
  messagingSenderId: '107244004765340502595',
  appId: '1:107244004765340502595:web:abc123def456ghi789'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);