"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.signOutUser = exports.signInWithGoogle = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: "AIzaSyB25XShHVczxQQUpiabZM0eYuVcgsmvlUg",
    authDomain: "rayyan-ai-4ef4c.firebaseapp.com", // Correct domain from the provided info
    projectId: "rayyan-ai-4ef4c", // Correct project ID from the provided info
    storageBucket: "rayyan-ai-4ef4c.appspot.com",
    appId: "1:88311205730:web:996300456c7998e5dbe63b",
};
// Initialize Firebase - prevent duplicate initialization during hot reloading
const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApp)();
const auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
const googleProvider = new auth_1.GoogleAuthProvider();
// Set custom parameters for the auth provider
googleProvider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline', // Request a refresh token
    // Use dynamic redirect detection
    redirect_uri: window.location.origin
});
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
const signInWithGoogle = async () => {
    try {
        // Clear any previous auth state to prevent conflicts
        if (auth.currentUser) {
            await (0, auth_1.signOut)(auth);
        }
        // Sign in with popup
        const result = await (0, auth_1.signInWithPopup)(auth, googleProvider);
        // Extract the OAuth access token
        const credential = auth_1.GoogleAuthProvider.credentialFromResult(result);
        if (!credential) {
            throw new Error("Failed to get authentication credentials");
        }
        const token = credential.accessToken;
        const user = result.user;
        if (!token) {
            throw new Error("No access token returned from Google authentication");
        }
        // Log success message
        console.log("OAuth Access Token obtained successfully");
        console.log("Token scopes:", credential.providerId);
        return { user, token };
    }
    catch (error) {
        // Log detailed error
        console.error("Error signing in with Google: ", {
            code: error.code,
            message: error.message,
            email: error.customData?.email,
            credential: error.customData?.credential
        });
        throw error;
    }
};
exports.signInWithGoogle = signInWithGoogle;
const signOutUser = async () => {
    try {
        await (0, auth_1.signOut)(auth);
    }
    catch (error) {
        console.error("Error signing out: ", {
            code: error.code,
            message: error.message
        });
        throw error;
    }
};
exports.signOutUser = signOutUser;
