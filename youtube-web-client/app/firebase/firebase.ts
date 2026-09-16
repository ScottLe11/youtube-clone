// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeruK07TCWFPdPDO6RfgpPiq2NLWORViA",
  authDomain: "yt-clone-a74e4.firebaseapp.com",
  projectId: "yt-clone-a74e4",

  appId: "1:335650862418:web:1251f95f89b72c6fd9f68b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const functions =  getFunctions();

export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOut(){
    return auth.signOut(); 
}

export function onAuthStateChangedHelper(callback: (user: User | null) => void){
    return onAuthStateChanged(auth, callback);
}