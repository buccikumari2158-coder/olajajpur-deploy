import { Stack } from "expo-router";

export default function RideLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
      <Stack.Screen name="confirm" />
      <Stack.Screen name="searching" />
      <Stack.Screen name="driver-assigned" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="driver-active" />
    </Stack>
  );
}
