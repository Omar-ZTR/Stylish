import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Phone,
    User,
} from "lucide-react-native";
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().split(" ").length < 2) {
      newErrors.fullName = "Please enter your first and last name";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Invalid email format";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and numbers";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({ fullName, email, phone, password });
      // Navigation happens automatically through AuthContext state change
    } catch {
      setErrors({ email: "Email already registered" });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength += 1;
    if (/(?=.*\d)/.test(password)) strength += 1;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength += 1;

    const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
    return {
      strength: strength,
      label: labels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)],
    };
  };

  const passwordStrength = getPasswordStrength();

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
            <View className="flex-row items-center justify-between mt-6 mb-10">
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
            <View className="mb-8">
              <Text
                style={{ fontFamily: "PlayfairB" }}
                className="text-4xl font-bold text-white mb-2"
              >
                Create Account
              </Text>
              <Text className="text-gray-400 text-base">
                Join our community of style enthusiasts
              </Text>
            </View>

            {/* Form Container */}
            <View className="mb-4">
              {/* Full Name Input */}
              <View className="mb-6">
                <Text className="text-white font-bold text-sm mb-3 tracking-wide">
                  FULL NAME
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl px-5 py-4 border-2 transition-colors ${
                    errors.fullName
                      ? "border-red-500 bg-red-500/10"
                      : "border-amber-500/30 bg-gray-900/60"
                  }`}
                >
                  <User
                    size={20}
                    color={errors.fullName ? "#ef4444" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#6b7280"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (errors.fullName)
                        setErrors({ ...errors, fullName: undefined });
                    }}
                    editable={!isLoading}
                    className="flex-1 ml-4 text-white text-base font-medium"
                    autoCapitalize="words"
                  />
                </View>
                {errors.fullName && (
                  <Text className="text-red-500 text-xs font-semibold mt-2">
                    {errors.fullName}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View className="mb-6">
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
                      if (errors.email)
                        setErrors({ ...errors, email: undefined });
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

              {/* Phone Input */}
              <View className="mb-6">
                <Text className="text-white font-bold text-sm mb-3 tracking-wide">
                  PHONE NUMBER
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl px-5 py-4 border-2 transition-colors ${
                    errors.phone
                      ? "border-red-500 bg-red-500/10"
                      : "border-amber-500/30 bg-gray-900/60"
                  }`}
                >
                  <Phone
                    size={20}
                    color={errors.phone ? "#ef4444" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#6b7280"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone)
                        setErrors({ ...errors, phone: undefined });
                    }}
                    editable={!isLoading}
                    className="flex-1 ml-4 text-white text-base font-medium"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && (
                  <Text className="text-red-500 text-xs font-semibold mt-2">
                    {errors.phone}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View className="mb-6">
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
                {password && (
                  <View className="mt-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </View>
                      <Text
                        style={{ color: passwordStrength.color }}
                        className="text-xs font-bold"
                      >
                        {passwordStrength.label}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View className="mb-6">
                <Text className="text-white font-bold text-sm mb-3 tracking-wide">
                  CONFIRM PASSWORD
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl px-5 py-4 border-2 transition-colors ${
                    errors.confirmPassword
                      ? "border-red-500 bg-red-500/10"
                      : "border-amber-500/30 bg-gray-900/60"
                  }`}
                >
                  <Lock
                    size={20}
                    color={errors.confirmPassword ? "#ef4444" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword)
                        setErrors({
                          ...errors,
                          confirmPassword: undefined,
                        });
                    }}
                    editable={!isLoading}
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 ml-4 text-white text-base font-medium"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <Eye size={20} color="#f59e0b" strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={20} color="#f59e0b" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>
                {password && confirmPassword && !errors.confirmPassword && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <CheckCircle size={16} color="#22c55e" />
                    <Text className="text-green-500 text-xs font-bold">
                      Passwords match
                    </Text>
                  </View>
                )}
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-xs font-semibold mt-2">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Terms and Conditions */}
              <TouchableOpacity
                onPress={() => setAgreeTerms(!agreeTerms)}
                disabled={isLoading}
                className="flex-row items-start gap-3 mb-7"
              >
                <View
                  className={`w-6 h-6 rounded-lg border-2 items-center justify-center mt-0.5 ${
                    agreeTerms
                      ? "bg-amber-500 border-amber-500"
                      : "border-gray-700"
                  }`}
                >
                  {agreeTerms && (
                    <CheckCircle size={20} color="white" strokeWidth={3} />
                  )}
                </View>
                <View className="flex-1 mt-1">
                  <Text className="text-gray-300 text-sm leading-relaxed">
                    I agree to the{" "}
                    <Text className="text-amber-400 font-bold">
                      Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text className="text-amber-400 font-bold">
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.terms && (
                <Text className="text-red-500 text-xs font-semibold mb-6">
                  {errors.terms}
                </Text>
              )}

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
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
                        Create Account
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

            {/* Login Link */}
            <View className="flex-row items-center justify-center py-6">
              <Text className="text-gray-400 text-sm">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/login")}
                disabled={isLoading}
              >
                <Text className="text-amber-400 font-bold text-sm ml-1">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
