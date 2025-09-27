import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user && !error);
  }, [user, error]);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    const userData = await response.json();
    queryClient.setQueryData(["/api/user"], userData);
    setIsAuthenticated(true);
  };

  const register = async (
    username: string,
    password: string,
    email?: string
  ) => {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, email }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    const userData = await response.json();
    queryClient.setQueryData(["/api/user"], userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    queryClient.clear();
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
