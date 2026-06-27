import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { registerForPushNotifications } from "@/lib/notifications";

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  photo?: string;
  role: "passenger" | "driver";
  walletBalance?: number;
  isDriver?: boolean;
  driverStatus?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem("auth_token"),
        AsyncStorage.getItem("auth_user"),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(newToken: string, newUser: User) {
    await Promise.all([
      AsyncStorage.setItem("auth_token", newToken),
      AsyncStorage.setItem("auth_user", JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);

    // Register push token after login (non-blocking, native only)
    registerForPushNotifications().then(async (pushToken) => {
      if (!pushToken) return;
      try {
        await fetch(`https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api/users/me/push-token`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${newToken}` },
          body: JSON.stringify({ pushToken }),
        });
        console.log("[Push] Token registered with server");
      } catch (e) {
        console.warn("[Push] Failed to register token:", e);
      }
    });
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem("auth_token"),
      AsyncStorage.removeItem("auth_user"),
    ]);
    setToken(null);
    setUser(null);
  }

  function updateUser(updates: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
