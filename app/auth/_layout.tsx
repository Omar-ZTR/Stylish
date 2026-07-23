import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="login"
        options={{
          animationEnabled: true,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          animationEnabled: true,
          presentation: "card",
        }}
      />
    </Stack>
  );
}
