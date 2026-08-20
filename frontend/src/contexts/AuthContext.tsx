import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("hrp_auth") === "true";
  });

  const user = isAuthenticated ? { email: "clinician@healthrisk.ai" } : null;

  function login(username: string, password: string): boolean {
    setIsAuthenticated(true);
    localStorage.setItem("hrp_auth", "true");
    return true;
  }

  function logout() {
    setIsAuthenticated(false);
    localStorage.removeItem("hrp_auth");
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
