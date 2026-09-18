import React, { createContext, ReactNode, useContext, useState } from "react";
import { api, setAuthToken, type RegistrationData, type User } from "@/src/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    setAuthToken(result.token);
    setUser(result.user);
    setIsLoggedIn(true);
  };

  const register = async (data: RegistrationData) => {
    const result = await api.register(data);
    setAuthToken(result.token);
    setUser(result.user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
