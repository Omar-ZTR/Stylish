import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="login"
        options={{
          animation: "default",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          animation: "default",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
