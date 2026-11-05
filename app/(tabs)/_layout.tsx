import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Tabs, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Text, TouchableOpacity, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { runOnJS } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "@/src/auth/AuthContext"

const LayoutContent = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const isBarber = user?.role === "barber"
  const segments = useSegments()
  const tabRoutes = ["index", "search", "booking", "favorites", "profile"] as const
  const lastSegment = segments[segments.length - 1]
  const currentTab = lastSegment === "(tabs)" ? "index" : lastSegment ?? "index"

  const navigateBySwipe = (direction: 1 | -1) => {
    const currentIndex = tabRoutes.indexOf(currentTab as (typeof tabRoutes)[number])
    const nextIndex = currentIndex + direction

    if (currentIndex >= 0 && nextIndex >= 0 && nextIndex < tabRoutes.length) {
      const nextRoute = tabRoutes[nextIndex]
      router.replace(nextRoute === "index" ? "/(tabs)" : `/(tabs)/${nextRoute}` as any)
    }
  }

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      if (Math.abs(event.translationX) < 60 && Math.abs(event.velocityX) < 400) return
      runOnJS(navigateBySwipe)(event.translationX < 0 ? 1 : -1)
    })

  return (
  <>
     <StatusBar style="light" />
     <GestureDetector gesture={swipeGesture}>
       <View collapsable={false} style={{ flex: 1 }}>
       <Tabs
       screenOptions={({ route }) => ({
         headerShown: route.name !== "index",
         header: () => {
           return (
          <LinearGradient
            colors={["#1a1a1a", "#0f0f0f"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="border-b border-gray-800"
             style={{ paddingTop: insets.top }}
           >
             <View className="flex-row items-center justify-between px-6 py-4">
              <Text
                style={{ fontFamily: "PlayfairB" }}
                className="text-3xl font-bold text-white"
              >
                Stylish
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/notifications")}
                  accessibilityRole="button"
                  accessibilityLabel="Open notifications"
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={24} color="#f59e0b" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/settings")}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={26} color="#f59e0b" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
           )
         },
         tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === "index" ? "home" :
            route.name === "search" ? "search" :
            route.name === "booking" ? "calendar" :
            route.name === "profile" ? "person" :
            route.name === "favorites" ? (isBarber ? "cut" : "bookmark") :
            "ellipse";
           return (
            <Ionicons 
              name={iconName as any} 
              size={size} 
              color={typeof color === "string" ? color : "#6b7280"}
              style={{ fontWeight: focused ? "bold" : "normal" }}
            />
           );
         },
         tabBarActiveTintColor: "#d97706",
         tabBarInactiveTintColor: "#6b7280",
         tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#374151",
          borderTopWidth: 1,
          height: 65 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
         },
         tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
         },
       })}
     >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="booking" options={{ title: "Booking" }} />
      <Tabs.Screen name="favorites" options={{ title: isBarber ? "Services" : "Saved" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
       </Tabs></View>
     </GestureDetector>
  </>
  )
}

export default LayoutContent