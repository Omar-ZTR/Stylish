import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Moon,
  Shield,
} from "lucide-react-native";
import { type ComponentType, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";

interface SettingItemProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitchItem?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDanger?: boolean;
  cardClass?: string;
}

function SettingItem({
  icon: Icon,
  label,
  value,
  onPress,
  isSwitchItem = false,
  switchValue,
  onSwitchChange,
  isDanger = false,
  cardClass = "",
}: SettingItemProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={isSwitchItem} activeOpacity={0.7} style={styles.settingRow}>
      <View style={[styles.settingCard, { backgroundColor: isDanger ? "rgba(239,68,68,0.05)" : cardClass ? cardClass.includes("white") ? "rgba(255,255,255,0.8)" : "rgba(17,24,39,0.4)" : "rgba(17,24,39,0.4)", borderColor: isDanger ? "rgba(239,68,68,0.2)" : cardClass && cardClass.includes("slate") ? "rgba(148,163,184,0.4)" : "rgba(75,85,99,0.8)" }]}>
        <View style={styles.settingLeft}>
          <Icon size={22} color={isDanger ? "#ef4444" : "#f59e0b"} strokeWidth={1.5} />
          <View style={styles.settingTextWrap}>
            <Text style={[styles.settingLabel, { color: isDanger ? "#ef4444" : "#FFFFFF" }]}>{label}</Text>
            {value ? <Text style={styles.settingValue}>{value}</Text> : null}
          </View>
        </View>
        {isSwitchItem ? (
          <Switch value={switchValue ?? false} onValueChange={onSwitchChange} trackColor={{ false: "#374151", true: "#f59e0b" }} thumbColor={switchValue ? "#fff" : "#9ca3af"} />
        ) : (
          <ChevronRight size={20} color="#6b7280" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const isDark = useColorScheme() === "dark";
  const gradientColors: readonly [string, string, string] = isDark ? ["#0f172a", "#1e293b", "#1a1a2e"] : ["#f8fafc", "#e2e8f0", "#dbeafe"];
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#9CA3AF" : "#475569";
  const cardBackground = isDark ? "rgba(17,24,39,0.4)" : "rgba(255,255,255,0.8)";
  const cardBorder = isDark ? "rgba(75,85,99,0.8)" : "rgba(148,163,184,0.4)";
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();
          router.replace("/auth");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.headerWrap}>
            <Text style={[styles.headerTitle, { color: textPrimary, fontFamily: "PlayfairB" }]}>Settings</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>Manage your account and preferences</Text>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>ACCOUNT</Text>
            <SettingItem icon={Mail} label="Email Address" value="user@example.com" onPress={() => {}} cardClass={cardBackground} />
            <SettingItem icon={Lock} label="Change Password" value="Last changed 2 months ago" onPress={() => {}} cardClass={cardBackground} />
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>NOTIFICATIONS</Text>
            <SettingItem icon={Bell} label="Push Notifications" isSwitchItem switchValue={notifications} onSwitchChange={setNotifications} cardClass={cardBackground} />
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>PRIVACY & SECURITY</Text>
            <SettingItem icon={Shield} label="Two-Factor Authentication" value="Add an extra layer of security" isSwitchItem switchValue={twoFA} onSwitchChange={setTwoFA} cardClass={cardBackground} />
            <SettingItem icon={Moon} label="Dark Mode" value="Always enabled" isSwitchItem switchValue={darkMode} onSwitchChange={setDarkMode} cardClass={cardBackground} />
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>SUPPORT</Text>
            <SettingItem icon={HelpCircle} label="Help Center" value="FAQs and tutorials" onPress={() => {}} cardClass={cardBackground} />
          </View>

          <View style={styles.logoutWrap}>
            <SettingItem icon={LogOut} label="Logout" onPress={handleLogout} isDanger cardClass={cardBackground} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Stylish v1.0.0</Text>
            <Text style={styles.footerTextSmall}>© 2026 Stylish. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerWrap: { paddingTop: 12, paddingBottom: 24 },
  headerTitle: { fontSize: 44, fontWeight: "700", marginBottom: 8 },
  headerSubtitle: { fontSize: 16, lineHeight: 24 },
  sectionWrap: { marginBottom: 28 },
  sectionTitle: { fontSize: 12, fontWeight: "700", marginBottom: 14, letterSpacing: 0.8 },
  settingRow: { marginBottom: 12 },
  settingCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingTextWrap: { flex: 1, marginLeft: 14 },
  settingLabel: { fontSize: 16, fontWeight: "700" },
  settingValue: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  logoutWrap: { marginBottom: 24 },
  footer: { borderTopWidth: 1, borderTopColor: "rgba(75,85,99,0.8)", paddingTop: 16, alignItems: "center" },
  footerText: { color: "#9CA3AF", fontSize: 12, marginBottom: 6 },
  footerTextSmall: { color: "#6B7280", fontSize: 12 },
});
