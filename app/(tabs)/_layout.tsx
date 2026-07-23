import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Tabs, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ArrowLeft } from "lucide-react-native"
import { Text, TouchableOpacity, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

const Layout = () => {
  const router = useRouter()

  return (
   <SafeAreaProvider>
     <StatusBar style="light" />
     <Tabs
       screenOptions={({ route }) => ({
         headerShown: true,
         header: () => {
           const isSettings = route.name === "settings"
           return (
          <LinearGradient
            colors={["#1a1a1a", "#0f0f0f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="border-b border-gray-800"
          >
            <View className="flex-row items-center justify-between px-6 py-4 mt-4">
              {isSettings ? (
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={28} color="#f59e0b" strokeWidth={2} />
                </TouchableOpacity>
              ) : (
                <Text
                  style={{ fontFamily: "PlayfairB" }}
                  className="text-3xl font-bold text-white"
                >
                  Stylish
                </Text>
              )}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/settings")}
                className="p-2"
                activeOpacity={0.7}
              >
                <Ionicons name="menu" size={28} color="#f59e0b" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
           )
         },
         tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === "index" ? "home" :
            route.name === "search" ? "search" :
            route.name === "profile" ? "person" :
            route.name === "favorites" ? "bookmark" :
            route.name === "notifications" ? "notifications" :
            "ellipse";
           return (
            <Ionicons 
              name={iconName as any} 
              size={size} 
              color={color}
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
          height: 65,
          paddingBottom: 8,
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
      <Tabs.Screen name="favorites" options={{ title: "Saved" }} />
      <Tabs.Screen name="notifications" options={{ title: "Updates" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", href: null }} />
     </Tabs>
   </SafeAreaProvider>
  )
}

export default Layout