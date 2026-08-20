import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile details for the authenticated user
  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data: UserProfile = await response.json();
      setUser(data);
      setIsAuthenticated(true);
      localStorage.setItem("hrp_auth", "true");
      return true;
    } catch {
      logout();
      return false;
    }
  };

  // Check auth status on startup
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, _: string): Promise<boolean> {
    const token = localStorage.getItem("access_token");
    if (token) {
      const success = await fetchProfile(token);
      return success;
    }
    return false;
  }

  function logout() {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("hrp_auth");
    localStorage.removeItem("access_token");
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
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
