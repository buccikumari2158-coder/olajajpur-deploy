import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export function useColors() {
  const { theme } = useTheme();
  return theme === "dark"
    ? { ...colors.dark, radius: colors.radius }
    : { ...colors.light, radius: colors.radius };
}
