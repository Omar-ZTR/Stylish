import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Invalid email format";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation happens automatically through AuthContext state change
    } catch {
      setErrors({ email: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#1a1a2e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            className="px-6"
          >
            {/* Header with Back Button */}
            <View className="flex-row items-center justify-between mt-6 mb-12">
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isLoading}
                className="flex-row items-center gap-2"
              >
                <ArrowLeft size={24} color="#f59e0b" strokeWidth={2} />
              </TouchableOpacity>
              <View className="flex-1 h-1 w-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mx-4" />
            </View>

            {/* Title */}
            <View className="mb-10">
              <Text
                style={{ fontFamily: "PlayfairB" }}
                className="text-5xl font-bold text-white mb-3"
              >
                Welcome Back
              </Text>
              <Text className="text-gray-400 text-base leading-relaxed">
                Sign in to access your bookings and preferences
              </Text>
            </View>

            {/* Form Container */}
            <View className="flex-1 justify-center mb-8">
              {/* Email Input */}
              <View className="mb-7">
                <Text className="text-white font-bold text-sm mb-3 tracking-wide">
                  EMAIL ADDRESS
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl px-5 py-4 border-2 transition-colors ${
                    errors.email
                      ? "border-red-500 bg-red-500/10"
                      : "border-amber-500/30 bg-gray-900/60"
                  }`}
                >
                  <Mail
                    size={20}
                    color={errors.email ? "#ef4444" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    editable={!isLoading}
                    className="flex-1 ml-4 text-white text-base font-medium"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && (
                  <Text className="text-red-500 text-xs font-semibold mt-2">
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View className="mb-2">
                <Text className="text-white font-bold text-sm mb-3 tracking-wide">
                  PASSWORD
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl px-5 py-4 border-2 transition-colors ${
                    errors.password
                      ? "border-red-500 bg-red-500/10"
                      : "border-amber-500/30 bg-gray-900/60"
                  }`}
                >
                  <Lock
                    size={20}
                    color={errors.password ? "#ef4444" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password)
                        setErrors({ ...errors, password: undefined });
                    }}
                    editable={!isLoading}
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-4 text-white text-base font-medium"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <Eye size={20} color="#f59e0b" strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={20} color="#f59e0b" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-red-500 text-xs font-semibold mt-2">
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity disabled={isLoading} className="self-end mb-10 mt-2">
                <Text className="text-amber-400 font-bold text-sm">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#f59e0b", "#d97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl py-5 flex-row items-center justify-center gap-3 shadow-lg"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text className="text-white text-lg font-bold tracking-wide">
                        Sign In
                      </Text>
                      <ArrowRight
                        size={20}
                        color="white"
                        strokeWidth={2.5}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-7">
              <View className="flex-1 h-px bg-gray-700" />
              <Text className="text-gray-500 mx-4 text-xs font-medium">OR CONTINUE WITH</Text>
              <View className="flex-1 h-px bg-gray-700" />
            </View>

            {/* Social Login Buttons */}
            <View className="flex-row gap-4 mb-8">
              <TouchableOpacity
                disabled={isLoading}
                className="flex-1 border-2 border-gray-700 rounded-2xl py-4 items-center backdrop-blur-sm hover:border-amber-500/50"
              >
                <Text className="text-white font-bold">Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isLoading}
                className="flex-1 border-2 border-gray-700 rounded-2xl py-4 items-center backdrop-blur-sm hover:border-amber-500/50"
              >
                <Text className="text-white font-bold">Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View className="flex-row items-center justify-center pb-6">
              <Text className="text-gray-400 text-sm">
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/register")}
                disabled={isLoading}
              >
                <Text className="text-amber-400 font-bold text-sm ml-1">
                  Create One
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
