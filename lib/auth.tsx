"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** When true, the app bypasses the login screen and auto-logs in. Set to false to enable login. */
  loginEnabled: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// CONFIGURACAO DO USUARIO PADRAO
// Quando loginEnabled = false, este usuario e auto-logado.
// Para ativar a tela de login, mude LOGIN_ENABLED para true.
// ============================================================
const LOGIN_ENABLED = false;

const DEFAULT_USER: AuthUser = {
  id: "eng-processo-1",
  name: "Engenharia de Processo",
  email: "engenharia.processo@empresa.com",
  role: "Administrador",
  permissions: ["all"],
  isActive: true,
};

// Credenciais para quando o login for ativado
// A senha sera definida depois - por enquanto aceita qualquer senha
const CREDENTIALS = {
  email: "engenharia.processo@empresa.com",
  // password: "" -- Defina a senha aqui quando ativar o login
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(
    LOGIN_ENABLED ? null : DEFAULT_USER
  );

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulacao de login - quando conectar ao backend, substituir por chamada real
    if (email === CREDENTIALS.email) {
      setUser(DEFAULT_USER);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // Se login nao esta habilitado, re-loga automaticamente
    if (!LOGIN_ENABLED) {
      setUser(DEFAULT_USER);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.permissions.includes("all")) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loginEnabled: LOGIN_ENABLED,
      login,
      logout,
      hasPermission,
    }),
    [user, login, logout, hasPermission]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
