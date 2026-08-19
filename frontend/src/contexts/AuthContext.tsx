import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("hrp_auth") === "true";
  });

  function login(username: string, password: string): boolean {
    // Hardcoded credentials for testing
    // Accept "admin" as username or email (case-insensitive)
    // Password must be "admin1234" (8+ characters to pass validation)
    const normalized = username.toLowerCase().trim();
    if ((normalized === "admin" || normalized.endsWith("@admin")) && password === "admin1234") {
      setIsAuthenticated(true);
      localStorage.setItem("hrp_auth", "true");
      return true;
    }
    return false;
  }

  function logout() {
    setIsAuthenticated(false);
    localStorage.removeItem("hrp_auth");
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
