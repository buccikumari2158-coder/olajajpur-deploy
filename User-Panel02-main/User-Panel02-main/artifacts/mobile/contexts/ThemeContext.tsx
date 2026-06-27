import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppTheme = "dark" | "light";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (t: AppTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  useEffect(() => {
    AsyncStorage.getItem("app_theme").then((val) => {
      if (val === "light" || val === "dark") setThemeState(val);
    });
  }, []);

  async function setTheme(t: AppTheme) {
    setThemeState(t);
    await AsyncStorage.setItem("app_theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
