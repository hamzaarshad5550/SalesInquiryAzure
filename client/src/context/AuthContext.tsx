import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "../lib/firebase";
import { initGoogleApi } from "../lib/googleApi";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  googleSignIn: () => Promise<User | undefined>;
  logOut: () => Promise<void>;
  isGoogleApiInitialized: boolean;
  oauthToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  googleSignIn: async () => undefined,
  logOut: async () => {},
  isGoogleApiInitialized: false,
  oauthToken: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleApiInitialized, setIsGoogleApiInitialized] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(() => {
    // Check session storage for existing token
    return sessionStorage.getItem('oauthToken');
  });

  // Initialize Google API when user is authenticated
  useEffect(() => {
    if (currentUser && oauthToken) {
      console.log("Attempting to initialize Google API with token");
      
      initGoogleApi(oauthToken)
        .then(() => {
          setIsGoogleApiInitialized(true);
          console.log("Google API initialized successfully");
        })
        .catch((error) => {
          console.error("Failed to initialize Google API:", error);
          // If initialization fails, try clearing the token and auth state
          sessionStorage.removeItem('oauthToken');
          setOauthToken(null);
          setIsGoogleApiInitialized(false);
        });
    } else {
      setIsGoogleApiInitialized(false);
      
      // Clear token if user is not authenticated
      if (!currentUser) {
        sessionStorage.removeItem('oauthToken');
        setOauthToken(null);
      }
    }
  }, [currentUser, oauthToken]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const googleSignIn = async () => {
    try {
      const { user, token } = await signInWithGoogle();
      if (token) {
        setOauthToken(token);
        // Store token in session storage for persistence
        sessionStorage.setItem('oauthToken', token);
      }
      return user;
    } catch (error) {
      console.error("Error during Google sign in:", error);
      throw error;
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error during sign out:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    googleSignIn,
    logOut,
    isGoogleApiInitialized,
    oauthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};