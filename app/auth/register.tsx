import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle,
  Clock3,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Mail,
  Phone,
  Scissors,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const isDark = useColorScheme() === "dark";
  const backgroundColors: readonly [string, string, string] = isDark ? ["#0f172a", "#1e293b", "#1a1a2e"] : ["#f8fafc", "#e2e8f0", "#dbeafe"];
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#9CA3AF" : "#475569";
  const inputBorder = isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.7)";
  const inputBackground = isDark ? "rgba(17, 24, 39, 0.65)" : "rgba(255, 255, 255, 0.8)";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "barber" | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState("13:00");
  const [pauseEndTime, setPauseEndTime] = useState("14:00");
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
    businessName?: string;
    location?: string;
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
    } else if (phone.replace(/\D/g, "").length < 8) {
      newErrors.phone = "Phone number must be at least 8 digits";
    }

    if (accountType === "barber") {
      if (!businessName.trim()) newErrors.businessName = "Business name is required";
      if (!location.trim()) newErrors.location = "Location is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and numbers";
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
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: accountType ?? "customer",
        ...(accountType === "barber" ? { barberProfile: { businessName: businessName.trim(), location: location.trim(), startTime, endTime, ...(pauseEnabled ? { pauseStartTime, pauseEndTime } : {}) } } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setErrors({ email: message });
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
      strength,
      label: labels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)],
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <LinearGradient colors={backgroundColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} disabled={isLoading} style={styles.backButton}>
                <ArrowLeft size={24} color="#f59e0b" strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.headerAccent} />
            </View>

            {!accountType ? (
              <View style={styles.choiceWrap}>
                <View style={styles.titleWrap}>
                  <Text style={[styles.eyebrow, { color: "#f59e0b" }]}>WELCOME TO STYLISH</Text>
                  <Text style={[styles.title, { color: textPrimary, fontFamily: "PlayfairB" }]}>How will you use Stylish?</Text>
                  <Text style={[styles.subtitle, { color: textSecondary }]}>Choose the experience that fits you. You can start booking or grow your own chair.</Text>
                </View>

                <TouchableOpacity onPress={() => setAccountType("customer")} activeOpacity={0.85} style={[styles.roleCard, { backgroundColor: inputBackground, borderColor: inputBorder }]}>
                  <View style={styles.roleIcon}><User size={25} color="#f59e0b" strokeWidth={1.8} /></View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, { color: textPrimary }]}>I&apos;m looking for a barber</Text>
                    <Text style={[styles.roleDescription, { color: textSecondary }]}>Discover great barbers and book your next look.</Text>
                  </View>
                  <ArrowRight size={20} color="#f59e0b" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAccountType("barber")} activeOpacity={0.85} style={[styles.roleCard, styles.barberRoleCard]}>
                  <View style={[styles.roleIcon, styles.barberRoleIcon]}><Scissors size={25} color="#111827" strokeWidth={1.8} /></View>
                  <View style={styles.roleCopy}>
                    <Text style={styles.roleTitleDark}>I&apos;m a barber</Text>
                    <Text style={styles.roleDescriptionDark}>Create your professional profile and welcome clients.</Text>
                  </View>
                  <ArrowRight size={20} color="#111827" />
                </TouchableOpacity>

                <View style={styles.choiceNote}><BriefcaseBusiness size={16} color={textSecondary} /><Text style={[styles.choiceNoteText, { color: textSecondary }]}>Your profile type controls what you see after signing in.</Text></View>
              </View>
            ) : (
              <>
            <View style={styles.titleWrap}>
              <View style={styles.stepRow}><Text style={[styles.eyebrow, { color: "#f59e0b" }]}>STEP 2 OF 2</Text><TouchableOpacity onPress={() => setAccountType(null)} disabled={isLoading}><Text style={styles.changeRole}>Change choice</Text></TouchableOpacity></View>
              <Text style={[styles.title, { color: textPrimary, fontFamily: "PlayfairB" }]}>{accountType === "barber" ? "Build your barber profile" : "Create Account"}</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>{accountType === "barber" ? "Put your craft in front of clients who are ready for their next look." : "Join our community of style enthusiasts"}</Text>
            </View>

            <View style={styles.formWrap}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: textPrimary }]}>FULL NAME</Text>
                <View style={[styles.inputContainer, { borderColor: errors.fullName ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                  <User size={20} color={errors.fullName ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#6b7280"
                    value={fullName}
                    style={[styles.input, { color: textPrimary }]}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                    }}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                </View>
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

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
                <Text style={[styles.label, { color: textPrimary }]}>PHONE NUMBER</Text>
                <View style={[styles.inputContainer, { borderColor: errors.phone ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                  <Phone size={20} color={errors.phone ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                  <TextInput
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#6b7280"
                    value={phone}
                    style={[styles.input, { color: textPrimary }]}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    editable={!isLoading}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {accountType === "barber" ? (
                <>
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.label, { color: textPrimary }]}>BUSINESS NAME</Text>
                    <View style={[styles.inputContainer, { borderColor: errors.businessName ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                      <Scissors size={20} color={errors.businessName ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                      <TextInput placeholder="The Golden Chair" placeholderTextColor="#6b7280" value={businessName} style={[styles.input, { color: textPrimary }]} onChangeText={setBusinessName} editable={!isLoading} autoCapitalize="words" />
                    </View>
                    {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.label, { color: textPrimary }]}>SHOP LOCATION</Text>
                    <View style={[styles.inputContainer, { borderColor: errors.location ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                      <MapPin size={20} color={errors.location ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                      <TextInput placeholder="Downtown Sousse" placeholderTextColor="#6b7280" value={location} style={[styles.input, { color: textPrimary }]} onChangeText={setLocation} editable={!isLoading} autoCapitalize="words" />
                    </View>
                    {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.label, { color: textPrimary }]}>OPENING HOURS</Text>
                    <View style={styles.hoursRow}>
                      <View style={[styles.inputContainer, styles.timeInput, { borderColor: inputBorder, backgroundColor: inputBackground }]}><Clock3 size={18} color="#f59e0b" strokeWidth={1.5} /><TextInput value={startTime} style={[styles.input, { color: textPrimary }]} onChangeText={setStartTime} editable={!isLoading} keyboardType="numbers-and-punctuation" /></View>
                      <Text style={[styles.toText, { color: textSecondary }]}>to</Text>
                      <View style={[styles.inputContainer, styles.timeInput, { borderColor: inputBorder, backgroundColor: inputBackground }]}><Clock3 size={18} color="#f59e0b" strokeWidth={1.5} /><TextInput value={endTime} style={[styles.input, { color: textPrimary }]} onChangeText={setEndTime} editable={!isLoading} keyboardType="numbers-and-punctuation" /></View>
                    </View>
                    <View style={styles.pauseToggleRow}>
                      <View style={styles.pauseToggleCopy}><Text style={[styles.pauseTitle, { color: textPrimary }]}>Add a break</Text><Text style={[styles.pauseDescription, { color: textSecondary }]}>Optional pause during your working day</Text></View>
                      <Switch value={pauseEnabled} onValueChange={setPauseEnabled} disabled={isLoading} trackColor={{ false: "#374151", true: "#f59e0b" }} thumbColor="#FFFFFF" />
                    </View>
                    {pauseEnabled ? (
                      <View style={styles.hoursRow}>
                        <View style={[styles.inputContainer, styles.timeInput, { borderColor: inputBorder, backgroundColor: inputBackground }]}><Clock3 size={18} color="#f59e0b" strokeWidth={1.5} /><TextInput value={pauseStartTime} style={[styles.input, { color: textPrimary }]} onChangeText={setPauseStartTime} editable={!isLoading} keyboardType="numbers-and-punctuation" /></View>
                        <Text style={[styles.toText, { color: textSecondary }]}>pause to</Text>
                        <View style={[styles.inputContainer, styles.timeInput, { borderColor: inputBorder, backgroundColor: inputBackground }]}><Clock3 size={18} color="#f59e0b" strokeWidth={1.5} /><TextInput value={pauseEndTime} style={[styles.input, { color: textPrimary }]} onChangeText={setPauseEndTime} editable={!isLoading} keyboardType="numbers-and-punctuation" /></View>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}

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
                {password ? (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthTrack}>
                      <View style={[styles.strengthFill, { width: `${(passwordStrength.strength / 5) * 100}%`, backgroundColor: passwordStrength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: textPrimary }]}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputContainer, { borderColor: errors.confirmPassword ? "#ef4444" : inputBorder, backgroundColor: inputBackground }]}>
                  <Lock size={20} color={errors.confirmPassword ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={confirmPassword}
                    style={[styles.input, { color: textPrimary }]}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    editable={!isLoading}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading} style={styles.iconButton}>
                    {showConfirmPassword ? <Eye size={20} color="#f59e0b" strokeWidth={1.5} /> : <EyeOff size={20} color="#f59e0b" strokeWidth={1.5} />}
                  </TouchableOpacity>
                </View>
                {password && confirmPassword && !errors.confirmPassword ? (
                  <View style={styles.matchRow}>
                    <CheckCircle size={16} color="#22c55e" />
                    <Text style={styles.successText}>Passwords match</Text>
                  </View>
                ) : null}
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity onPress={() => setAgreeTerms(!agreeTerms)} disabled={isLoading} style={styles.termsRow}>
                <View style={[styles.checkbox, { backgroundColor: agreeTerms ? "#f59e0b" : "transparent", borderColor: agreeTerms ? "#f59e0b" : "#6b7280" }]}>
                  {agreeTerms ? <CheckCircle size={18} color="white" strokeWidth={3} /> : null}
                </View>
                <View style={styles.termsTextWrap}>
                  <Text style={[styles.termsText, { color: textSecondary }]}>I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text></Text>
                </View>
              </TouchableOpacity>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

              <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient colors={["#f59e0b", "#d97706"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Create Account</Text>
                      <ArrowRight size={20} color="white" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")} disabled={isLoading}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 32 },
  backButton: { padding: 8 },
  headerAccent: { flex: 1, height: 4, borderRadius: 999, backgroundColor: "#f59e0b", marginLeft: 16 },
  titleWrap: { marginBottom: 28 },
  choiceWrap: { flex: 1, justifyContent: "center", paddingBottom: 24 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.4, marginBottom: 12 },
  roleCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 22, padding: 18, marginBottom: 14 },
  barberRoleCard: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  roleIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(245,158,11,0.14)", alignItems: "center", justifyContent: "center", marginRight: 14 },
  barberRoleIcon: { backgroundColor: "rgba(17,24,39,0.12)" },
  roleCopy: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: "800", marginBottom: 5 },
  roleDescription: { fontSize: 13, lineHeight: 19 },
  roleTitleDark: { color: "#111827", fontSize: 16, fontWeight: "800", marginBottom: 5 },
  roleDescriptionDark: { color: "rgba(17,24,39,0.72)", fontSize: 13, lineHeight: 19 },
  choiceNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, gap: 7 },
  choiceNoteText: { fontSize: 12 },
  stepRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  changeRole: { color: "#fbbf24", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 40, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  formWrap: { marginBottom: 16 },
  fieldWrap: { marginBottom: 16 },
  hoursRow: { flexDirection: "row", alignItems: "center" },
  timeInput: { flex: 1, paddingHorizontal: 12 },
  toText: { marginHorizontal: 9, fontSize: 13, fontWeight: "700" },
  pauseToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 12 },
  pauseToggleCopy: { flex: 1 },
  pauseTitle: { fontSize: 14, fontWeight: "700" },
  pauseDescription: { fontSize: 12, marginTop: 3 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 10, letterSpacing: 0.8 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: "500" },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 },
  strengthWrap: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  strengthTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "#374151", overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: 999 },
  strengthLabel: { marginLeft: 10, fontSize: 12, fontWeight: "700" },
  matchRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  successText: { color: "#22c55e", fontSize: 12, fontWeight: "700", marginLeft: 8 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2, marginRight: 12 },
  termsTextWrap: { flex: 1 },
  termsText: { fontSize: 14, lineHeight: 20 },
  termsLink: { color: "#fbbf24", fontWeight: "700" },
  primaryButton: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#f59e0b", shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  footerText: { fontSize: 14 },
  footerLink: { color: "#fbbf24", fontSize: 14, fontWeight: "700" },
  iconButton: { paddingHorizontal: 4 },
});
