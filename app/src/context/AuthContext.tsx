import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  getIdTokenResult
} from "firebase/auth";
import { auth } from "../lib/firebase.config";

export type UserRole = "admin" | "investigator";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  badgeNumber?: string;
  department?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  isLocked: boolean;
  lockWorkstation: () => void;
  unlockWorkstation: () => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback Credentials for Network Failures / Offline Testing / Prototype Demonstration
const FALLBACK_ACCOUNTS: Record<string, { pass: string; user: UserProfile }> = {
  "kartik@jaal.gov.in": {
    pass: "investigator123",
    user: {
      uid: "investigator-kartik",
      email: "kartik@jaal.gov.in",
      displayName: "Kartik",
      role: "investigator",
      badgeNumber: "IND-IO-26189",
      department: "Special Cell (Delhi Police)"
    }
  },
  "admin@ncrb.gov.in": {
    pass: "Admin@2026!",
    user: {
      uid: "admin-001",
      email: "admin@ncrb.gov.in",
      displayName: "Krishna Singh",
      role: "admin",
      badgeNumber: "MHA-ADM-001",
      department: "NCRB Intelligence Command"
    }
  },
  "investigator@ncrb.gov.in": {
    pass: "investigator123",
    user: {
      uid: "investigator-001",
      email: "investigator@ncrb.gov.in",
      displayName: "Kartik",
      role: "investigator",
      badgeNumber: "IND-IO-26189",
      department: "Special Cell (Delhi Police)"
    }
  },
  "admin@jaal.gov.in": {
    pass: "123456",
    user: {
      uid: "admin-jaal",
      email: "admin@jaal.gov.in",
      displayName: "Kartik",
      role: "investigator",
      badgeNumber: "IND-IO-26189",
      department: "Operation Grey Ledger"
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage for active session
    const savedSession = localStorage.getItem("gotham_active_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed.user);
        setToken(parsed.token);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("gotham_active_session");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const authToken = await firebaseUser.getIdToken();
          const role = (tokenResult.claims.role as UserRole) || "investigator";
          const badge = (tokenResult.claims.badge as string) || "IND-26189";
          const dept = (tokenResult.claims.dept as string) || "NCRB / Cyber Cell";

          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (role === "admin" ? "Master Admin" : "Officer Sharma"),
            role,
            badgeNumber: badge,
            department: dept
          };

          setUser(profile);
          setToken(authToken);
          localStorage.setItem("gotham_active_session", JSON.stringify({ user: profile, token: authToken }));
        } catch (err) {
          console.error("Error fetching token claims from Firebase:", err);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailInput: string, passInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    // 0. Instant offline / fallback demo check
    const fallback = FALLBACK_ACCOUNTS[cleanEmail];
    if (fallback && fallback.pass === passInput) {
      const fallbackToken = `demo-jwt-token-${fallback.user.role}-gotham`;
      setUser(fallback.user);
      setToken(fallbackToken);
      localStorage.setItem("gotham_active_session", JSON.stringify({ user: fallback.user, token: fallbackToken }));
      return;
    }

    try {
      // 1. Attempt Live Firebase Cloud Authentication
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, passInput);
      const authToken = await cred.user.getIdToken(true);
      const tokenResult = await getIdTokenResult(cred.user);
      const role = (tokenResult.claims.role as UserRole) || (cleanEmail.includes("admin") ? "admin" : "investigator");

      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || (role === "admin" ? "Krishna Singh" : "Krishna Singh"),
        role,
        badgeNumber: (tokenResult.claims.badge as string) || "IND-9942",
        department: (tokenResult.claims.dept as string) || "MHA Special Operations"
      };

      setUser(profile);
      setToken(authToken);
      localStorage.setItem("gotham_active_session", JSON.stringify({ user: profile, token: authToken }));
    } catch (err: any) {
      console.warn("Firebase Auth Error:", err?.code, err?.message);

      // If fallback matches password, accept it
      if (fallback && fallback.pass === passInput) {
        const fallbackToken = `demo-jwt-token-${fallback.user.role}-gotham`;
        setUser(fallback.user);
        setToken(fallbackToken);
        localStorage.setItem("gotham_active_session", JSON.stringify({ user: fallback.user, token: fallbackToken }));
        return;
      }

      throw err;
    }
  };

  const lockWorkstation = () => {
    setIsLocked(true);
  };

  const unlockWorkstation = () => {
    setIsLocked(false);
  };

  const logout = async () => {
    localStorage.removeItem("gotham_active_session");
    setIsLocked(false);
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, isLocked, lockWorkstation, unlockWorkstation, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
