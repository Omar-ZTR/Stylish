import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const isDark = useColorScheme() === "dark";
  const backgroundColors: readonly [string, string, string] = isDark ? ["#0f172a", "#1e293b", "#1a1a2e"] : ["#f8fafc", "#e2e8f0", "#dbeafe"];
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#9CA3AF" : "#475569";
  const inputBorder = isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.7)";
  const inputBackground = isDark ? "rgba(17, 24, 39, 0.65)" : "rgba(255, 255, 255, 0.8)";
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
    } catch {
      setErrors({ email: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={backgroundColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} disabled={isLoading} style={styles.backButton}>
                <ArrowLeft size={24} color="#f59e0b" strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.titleWrap}>
              <Text style={[styles.title, { color: textPrimary, fontFamily: "PlayfairB" }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>Sign in to access your bookings and preferences</Text>
            </View>

            <View style={styles.formWrap}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: textPrimary }]}>EMAIL ADDRESS</Text>
                <View style={[styles.inputContainer, { borderColor: errors.email ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                  <Mail size={20} color={errors.email ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor="#6b7280"
                    value={email}
                    style={[styles.input, { color: textPrimary }]}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: textPrimary }]}>PASSWORD</Text>
                <View style={[styles.inputContainer, { borderColor: errors.password ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                  <Lock size={20} color={errors.password ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    style={[styles.input, { color: textPrimary }]}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    editable={!isLoading}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading} style={styles.iconButton}>
                    {showPassword ? <Eye size={20} color="#f59e0b" strokeWidth={1.5} /> : <EyeOff size={20} color="#f59e0b" strokeWidth={1.5} />}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <TouchableOpacity disabled={isLoading} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient colors={["#f59e0b", "#d97706"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                      <ArrowRight size={20} color="white" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLineThin} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLineThin} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity disabled={isLoading} style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isLoading} style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")} disabled={isLoading}>
                <Text style={styles.footerLink}>Create One</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 32 },
  backButton: { padding: 8 },
  dividerLine: { flex: 1, height: 4, borderRadius: 999, backgroundColor: "#f59e0b", marginLeft: 16 },
  titleWrap: { marginBottom: 32 },
  title: { fontSize: 44, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  formWrap: { flex: 1, justifyContent: "center", marginBottom: 24 },
  fieldWrap: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 10, letterSpacing: 0.8 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: "500" },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 },
  forgotButton: { alignSelf: "flex-end", marginTop: 2, marginBottom: 24 },
  forgotText: { color: "#fbbf24", fontSize: 13, fontWeight: "700" },
  primaryButton: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#f59e0b", shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dividerLineThin: { flex: 1, height: 1, backgroundColor: "#374151" },
  dividerText: { color: "#6b7280", fontSize: 11, fontWeight: "600", marginHorizontal: 14 },
  socialRow: { flexDirection: "row", marginBottom: 28 },
  socialButton: { flex: 1, borderWidth: 2, borderColor: "#374151", borderRadius: 18, paddingVertical: 14, alignItems: "center", marginHorizontal: 6, backgroundColor: "rgba(255,255,255,0.02)" },
  socialButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  footerText: { color: "#9CA3AF", fontSize: 14 },
  footerLink: { color: "#fbbf24", fontSize: 14, fontWeight: "700" },
  iconButton: { paddingHorizontal: 4 },
});
