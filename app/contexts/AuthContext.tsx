"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  rootId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rootId, setRootId] = useState<string | null>(null);

  useEffect(() => {
    // 从 localStorage 读取登录信息
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const rootId = localStorage.getItem("rootId");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRootId(rootId);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    const decoded = jwtDecode<{ rootId: string }>(newToken);
    setToken(newToken);
    setUser(newUser);
    setRootId(decoded.rootId);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("rootId", decoded.rootId);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRootId(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rootId");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, rootId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
