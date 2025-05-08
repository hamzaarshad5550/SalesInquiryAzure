import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "rayyan-ai-4ef4c.firebaseapp.com", // Use exact domain name without template literals
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add Google OAuth scopes for Gmail, Calendar, and Contacts APIs
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts');

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Extract the OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    // Log success message
    console.log("OAuth Access Token obtained successfully");
    
    return { user, token };
  } catch (error: any) {
    // Log detailed error
    console.error("Error signing in with Google: ", {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error signing out: ", {
      code: error.code,
      message: error.message
    });
    throw error;
  }
};

export { auth };