import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight, Clock, Users, Zap } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthWelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#1a1a2e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6 py-8"
        >
          {/* Top Accent */}
          <View className="h-1 w-24 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-8" />

          {/* Hero Section */}
          <View className="flex-1 justify-center items-center gap-6 mb-12">
            {/* Logo Circle */}
            <View className="relative">
              <LinearGradient
                colors={["#f59e0b", "#d97706", "#b45309"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-28 h-28 rounded-full items-center justify-center shadow-2xl"
              >
                <Text
                  style={{ fontFamily: "PlayfairB", fontSize: 64 }}
                  className="text-white font-bold"
                >
                  ✂
                </Text>
              </LinearGradient>
              {/* Glow effect */}
              <View className="absolute inset-0 rounded-full bg-amber-500/20 blur-3xl" />
            </View>

            {/* Title */}
            <View className="items-center gap-3">
              <Text
                style={{ fontFamily: "PlayfairB" }}
                className="text-6xl font-bold text-white text-center leading-tight"
              >
                Stylish
              </Text>
              <View className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
              <Text className="text-gray-300 text-center text-base leading-relaxed font-light tracking-wide">
                Premium Barber Experience
              </Text>
            </View>

            {/* Features Grid */}
            <View className="gap-4 w-full mt-10">
              {/* Feature 1 */}
              <View className="flex-row gap-4 items-start bg-WHITE/5 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/20">
                <View className="mt-1">
                  <Zap size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base mb-1">
                    Expert Barbers
                  </Text>
                  <Text className="text-gray-400 text-sm leading-relaxed">
                    Top-rated professionals at your fingertips
                  </Text>
                </View>
              </View>

              {/* Feature 2 */}
              <View className="flex-row gap-4 items-start bg-WHITE/5 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/20">
                <View className="mt-1">
                  <Clock size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base mb-1">
                    Instant Booking
                  </Text>
                  <Text className="text-gray-400 text-sm leading-relaxed">
                    Schedule appointments in seconds
                  </Text>
                </View>
              </View>

              {/* Feature 3 */}
              <View className="flex-row gap-4 items-start bg-WHITE/5 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/20">
                <View className="mt-1">
                  <Users size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base mb-1">
                    Trusted Reviews
                  </Text>
                  <Text className="text-gray-400 text-sm leading-relaxed">
                    Real feedback from verified customers
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pb-6">
            {/* Primary Button */}
            <TouchableOpacity
              onPress={() => router.push("/auth/register")}
              activeOpacity={0.85}
              className="shadow-lg"
            >
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-5 flex-row items-center justify-center gap-3"
              >
                <Text className="text-white text-lg font-bold tracking-wide">
                  Get Started
                </Text>
                <ArrowRight size={20} color="white" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Button */}
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.85}
              className="border-2 border-amber-500/50 rounded-2xl py-5 items-center backdrop-blur-sm"
            >
              <Text className="text-white text-lg font-bold tracking-wide">
                Already Have Account?
              </Text>
              <Text className="text-amber-400 text-sm mt-1">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
