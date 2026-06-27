import { Stack } from "expo-router";

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="[slug]" />
    </Stack>
  );
}
