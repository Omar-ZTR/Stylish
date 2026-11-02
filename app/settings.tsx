import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Mail,
  Moon,
  Pencil,
  Phone,
  Shield,
} from "lucide-react-native";
import { type ComponentType, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

type Theme = {
  textPrimary: string;
  textSecondary: string;
  cardBackground: string;
  cardBorder: string;
  divider: string;
};

interface SettingItemProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDanger?: boolean;
  theme: Theme;
}

function SettingItem({
  icon: Icon,
  label,
  description,
  onPress,
  switchValue,
  onSwitchChange,
  isDanger = false,
  theme,
}: SettingItemProps) {
  const isSwitchItem = onSwitchChange !== undefined;
  const content = (
    <>
      <View style={[styles.settingIcon, isDanger && styles.dangerIcon]}>
        <Icon size={19} color={isDanger ? "#ef4444" : "#f5b942"} strokeWidth={1.8} />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={[styles.settingLabel, { color: isDanger ? "#ef4444" : theme.textPrimary }]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {isSwitchItem ? (
        <Switch
          value={switchValue ?? false}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#3f3f46", true: "#d99b26" }}
          thumbColor={switchValue ? "#fffaf0" : "#a1a1aa"}
          accessibilityRole="switch"
          accessibilityLabel={label}
          accessibilityState={{ checked: switchValue ?? false }}
        />
      ) : (
        <ChevronRight
          size={19}
          color={isDanger ? "#ef4444" : theme.textSecondary}
          strokeWidth={1.8}
        />
      )}
    </>
  );

  if (isSwitchItem) {
    return <View style={styles.settingRow}>{content}</View>;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.settingRow}
    >
      {content}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, updateProfile, user } = useAuth();
  const isDark = useColorScheme() !== "light";
  const gradientColors: readonly [string, string, string] = isDark
    ? ["#11110f", "#171612", "#111111"]
    : ["#fffaf0", "#f7f1e6", "#f4efe5"];
  const theme: Theme = {
    textPrimary: isDark ? "#fffdf7" : "#201a11",
    textSecondary: isDark ? "#a7a29a" : "#71685b",
    cardBackground: isDark ? "rgba(31,30,26,0.88)" : "rgba(255,255,255,0.84)",
    cardBorder: isDark ? "rgba(245,185,66,0.15)" : "rgba(111,83,37,0.14)",
    divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(32,26,17,0.08)",
  };
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const displayName = user?.fullName?.trim() || "Stylish member";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const openProfileEditor = () => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setSaveError("");
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (fullName.trim().length < 2) {
      setSaveError("Your name must be at least 2 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSaveError("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      setIsEditOpen(false);
      Alert.alert("Profile updated", "Your account information has been saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to update your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        onPress: () => {
          logout();
          router.replace("/auth");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.intro}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>YOUR STYLISH EXPERIENCE</Text>
            </View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: "PlayfairB" }]}>
              Make it yours.
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Your account, privacy and preferences — all in one place.
            </Text>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>YOUR ACCOUNT</Text>
              <Text style={styles.sectionCaption}>PERSONAL DETAILS</Text>
            </View>
            <View
              style={[
                styles.accountCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <View style={styles.accountIdentity}>
                <LinearGradient
                  colors={["#f5c45e", "#d88920"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accountAvatar}
                >
                  <Text style={styles.avatarInitials}>{initials || "SM"}</Text>
                </LinearGradient>
                <View style={styles.accountIdentityText}>
                  <Text
                    style={[styles.accountName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <View style={styles.accountRolePill}>
                    <Text style={styles.accountRole}>
                      {user?.role === "barber" ? "BARBER" : "MEMBER"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={openProfileEditor}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Edit account information"
                  style={styles.editProfileButton}
                >
                  <Pencil size={18} color="#f5b942" strokeWidth={2} />
                  
                </TouchableOpacity>
              </View>

              <View style={[styles.accountDivider, { borderColor: theme.divider }]} />

              <View style={styles.accountDetailRow}>
                <View style={styles.detailIcon}>
                  <Mail size={16} color="#f5b942" strokeWidth={1.8} />
                </View>
                <View style={styles.accountDetailText}>
                  <Text style={styles.accountDetailLabel}>EMAIL ADDRESS</Text>
                  <Text
                    style={[styles.accountDetailValue, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {user?.email || "Not provided"}
                  </Text>
                </View>
              </View>
              <View style={styles.accountDetailRow}>
                <View style={styles.detailIcon}>
                  <Phone size={16} color="#f5b942" strokeWidth={1.8} />
                </View>
                <View style={styles.accountDetailText}>
                  <Text style={styles.accountDetailLabel}>PHONE NUMBER</Text>
                  <Text
                    style={[styles.accountDetailValue, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {user?.phone || "Not provided"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>PREFERENCES</Text>
              <Text style={styles.sectionCaption}>YOUR WAY</Text>
            </View>
            <View
              style={[
                styles.settingGroup,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <SettingItem
                icon={Bell}
                label="Push notifications"
                description="Stay up to date with your bookings"
                switchValue={notifications}
                onSwitchChange={setNotifications}
                theme={theme}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />
              <SettingItem
                icon={Moon}
                label="Dark mode"
                description="Always enabled"
                switchValue={darkMode}
                onSwitchChange={setDarkMode}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                PRIVACY & SECURITY
              </Text>
              <Text style={styles.sectionCaption}>KEEP IT SAFE</Text>
            </View>
            <View
              style={[
                styles.settingGroup,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <SettingItem
                icon={Shield}
                label="Two-factor authentication"
                description="Add an extra layer of security"
                switchValue={twoFA}
                onSwitchChange={setTwoFA}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>NEED A HAND?</Text>
              <Text style={styles.sectionCaption}>WE’RE HERE</Text>
            </View>
            <View
              style={[
                styles.settingGroup,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <SettingItem
                icon={HelpCircle}
                label="Help Center"
                description="FAQs and tips for using Stylish"
                onPress={() => Alert.alert("Help Center", "Support resources are coming soon.")}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.logoutWrap}>
            <SettingItem
              icon={LogOut}
              label="Log out"
              description="Sign out of your account"
              onPress={handleLogout}
              isDanger
              theme={theme}
            />
          </View>

          <View style={[styles.footer, { borderColor: theme.divider }]}>
            <Text style={styles.footerText}>STYLISH · VERSION 1.0.0</Text>
            <Text style={styles.footerTextSmall}>Made for your next great look.</Text>
          </View>
        </ScrollView>
        <Modal
          visible={isEditOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsEditOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalOverlay}
          >
            <View
              style={[
                styles.editModal,
                {
                  backgroundColor: isDark ? "#1b1a17" : "#fffaf0",
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeading}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit your details</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    Keep your account information up to date.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsEditOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile editor"
                  style={styles.closeButton}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 21 }}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>FULL NAME</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={isDark ? "#77736c" : "#9b9182"}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                style={[
                  styles.profileInput,
                  {
                    color: theme.textPrimary,
                    backgroundColor: isDark ? "#121210" : "#ffffff",
                    borderColor: theme.cardBorder,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={isDark ? "#77736c" : "#9b9182"}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
                style={[
                  styles.profileInput,
                  {
                    color: theme.textPrimary,
                    backgroundColor: isDark ? "#121210" : "#ffffff",
                    borderColor: theme.cardBorder,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>PHONE NUMBER</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Add a phone number (optional)"
                placeholderTextColor={isDark ? "#77736c" : "#9b9182"}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="done"
                style={[
                  styles.profileInput,
                  {
                    color: theme.textPrimary,
                    backgroundColor: isDark ? "#121210" : "#ffffff",
                    borderColor: theme.cardBorder,
                  },
                ]}
              />

              {saveError ? (
                <Text accessibilityRole="alert" style={styles.saveError}>{saveError}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.82}
                accessibilityRole="button"
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#241a0b" />
                ) : (
                  <Text style={styles.saveButtonText}>Save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 32 },
  intro: { paddingTop: 8, paddingBottom: 28 },
  eyebrow: { flexDirection: "row", alignItems: "center", marginBottom: 11 },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#f5b942", marginRight: 8 },
  eyebrowText: { color: "#e5aa3c", fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  headerTitle: { fontSize: 36, fontWeight: "700", letterSpacing: -0.5, marginBottom: 7 },
  headerSubtitle: { fontSize: 14, lineHeight: 21, maxWidth: 310 },
  sectionWrap: { marginBottom: 24 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  sectionCaption: { color: "#8f826c", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  settingGroup: { borderRadius: 19, borderWidth: 1, paddingHorizontal: 14 },
  settingRow: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingVertical: 11 },
  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,185,66,0.11)",
  },
  dangerIcon: { backgroundColor: "rgba(239,68,68,0.09)" },
  settingTextWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  settingLabel: { fontSize: 14, fontWeight: "700" },
  settingDescription: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 51 },
  accountCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  accountIdentity: { flexDirection: "row", alignItems: "center" },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    backgroundColor: "rgba(245,185,66,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  editProfileText: { color: "#e5aa3c", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  accountAvatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#241a0b", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
  accountIdentityText: { flex: 1, marginLeft: 13 },
  accountName: { fontSize: 16, fontWeight: "800" },
  accountRolePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,185,66,0.13)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  accountRole: { color: "#e5aa3c", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  accountDivider: { borderTopWidth: 1, marginVertical: 15 },
  accountDetailRow: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  detailIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,185,66,0.09)",
  },
  accountDetailText: { flex: 1, marginLeft: 10 },
  accountDetailLabel: { color: "#8f887c", fontSize: 9, fontWeight: "800", letterSpacing: 0.9 },
  accountDetailValue: { fontSize: 13, fontWeight: "600", marginTop: 3 },
  logoutWrap: { marginTop: 0, marginBottom: 18 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  editModal: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 22 },
  modalHeading: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  modalSubtitle: { fontSize: 12, marginTop: 5 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(127,127,127,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: -4,
  },
  inputLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 7 },
  profileInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 14,
    marginBottom: 16,
  },
  saveError: { color: "#ef4444", fontSize: 12, lineHeight: 17, marginBottom: 13 },
  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5b942",
    marginTop: 2,
  },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: "#241a0b", fontSize: 14, fontWeight: "800" },
  footer: { borderTopWidth: 1, paddingTop: 17, alignItems: "center" },
  footerText: { color: "#b99a61", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginBottom: 6 },
  footerTextSmall: { color: "#8f887c", fontSize: 11 },
});
