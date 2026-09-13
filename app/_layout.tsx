import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "@/src/auth/AuthContext";
import "./global.css";

function RootLayoutContent() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [isSplashReady, setIsSplashReady] = useState(false);
  const splashColors: readonly [string, string] = isDark ? ["#1a1a1a", "#2d2d2d"] : ["#f8fafc", "#e2e8f0"];
  const logoColors: readonly [string, string] = isDark ? ["#d97706", "#b45309"] : ["#f59e0b", "#f97316"];
  const titleColor = isDark ? "text-white" : "text-slate-900";

  const [fontLoaded, error] = useFonts({
    PlayfairBI: require("../assets/fonts/PlayfairDisplay-BlackItalic.ttf"),
    PlayfairB: require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
    PlayfairR: require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    PlayfairI: require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
    PlayfairEB: require("../assets/fonts/PlayfairDisplay-ExtraBold.ttf"),
    PlayfairBIT: require("../assets/fonts/PlayfairDisplay-BoldItalic.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontLoaded) {
      SplashScreen.hideAsync();
      // Show splash screen for 2.5 seconds
      const timer = setTimeout(() => {
        setIsSplashReady(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [fontLoaded, error]);

  // Navigate based on auth state
  useEffect(() => {
    if (isSplashReady) {
      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth");
      }
    }
  }, [isLoggedIn, isSplashReady, router]);

  // Show splash screen while loading
  if (!isSplashReady || !fontLoaded) {
    return (
      <LinearGradient colors={splashColors} className="flex-1">
        <View className="flex-1 justify-center items-center">
          <LinearGradient
            colors={logoColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-32 h-32 rounded-full items-center justify-center"
          >
            <Text
              style={{ fontFamily: "PlayfairB", fontSize: 60 }}
              className="text-white font-bold"
            >
              ✂
            </Text>
          </LinearGradient>
          <Text
            style={{ fontFamily: "PlayfairB", marginTop: 20, fontSize: 24 }}
            className={`${titleColor} font-bold`}
          >
            Stylish
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ animation: "none" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen
        name="barber/[id]"
        options={{
          animation: "default",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="book/[barberId]/[serviceId]"
        options={{
          animation: "default",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="book/multi/[barberId]"
        options={{
          animation: "default",
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}


