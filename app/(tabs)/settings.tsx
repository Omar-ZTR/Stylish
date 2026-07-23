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
import { useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
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

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    isSwitchItem = false,
    switchValue,
    onSwitchChange,
    isDanger = false,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isSwitchItem}
      activeOpacity={0.7}
      className="mb-3"
    >
      <View
        className={`flex-row items-center justify-between rounded-2xl px-5 py-4 border border-gray-800 ${
          isDanger ? "bg-red-500/5" : "bg-gray-900/40"
        }`}
      >
        <View className="flex-row items-center gap-4 flex-1">
          <Icon
            size={22}
            color={isDanger ? "#ef4444" : "#f59e0b"}
            strokeWidth={1.5}
          />
          <View className="flex-1">
            <Text className={`font-bold text-base ${isDanger ? "text-red-500" : "text-white"}`}>
              {label}
            </Text>
            {value && (
              <Text className="text-gray-400 text-xs mt-1">{value}</Text>
            )}
          </View>
        </View>
        {isSwitchItem ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: "#374151", true: "#f59e0b" }}
            thumbColor={switchValue ? "#fff" : "#9ca3af"}
          />
        ) : (
          <ChevronRight size={20} color="#6b7280" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );

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
          className="px-6"
        >
          {/* Header */}
          <View className="pt-6 pb-8">
            <Text
              style={{ fontFamily: "PlayfairB" }}
              className="text-5xl font-bold text-white mb-2"
            >
              Settings
            </Text>
            <Text className="text-gray-400 text-base">
              Manage your account and preferences
            </Text>
          </View>

          {/* Account Section */}
          <View className="mb-8">
            <Text className="text-white font-bold text-sm mb-4 tracking-wide">
              ACCOUNT
            </Text>
            <SettingItem
              icon={Mail}
              label="Email Address"
              value="user@example.com"
              onPress={() => {}}
            />
            <SettingItem
              icon={Lock}
              label="Change Password"
              value="Last changed 2 months ago"
              onPress={() => {}}
            />
          </View>

          {/* Notifications Section */}
          <View className="mb-8">
            <Text className="text-white font-bold text-sm mb-4 tracking-wide">
              NOTIFICATIONS
            </Text>
            <SettingItem
              icon={Bell}
              label="Push Notifications"
              isSwitchItem
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>

          {/* Privacy & Security Section */}
          <View className="mb-8">
            <Text className="text-white font-bold text-sm mb-4 tracking-wide">
              PRIVACY & SECURITY
            </Text>
            <SettingItem
              icon={Shield}
              label="Two-Factor Authentication"
              value="Add an extra layer of security"
              isSwitchItem
              switchValue={twoFA}
              onSwitchChange={setTwoFA}
            />
            <SettingItem
              icon={Moon}
              label="Dark Mode"
              value="Always enabled"
              isSwitchItem
              switchValue={darkMode}
              onSwitchChange={setDarkMode}
            />
          </View>

          {/* Support Section */}
          <View className="mb-8">
            <Text className="text-white font-bold text-sm mb-4 tracking-wide">
              SUPPORT
            </Text>
            <SettingItem
              icon={HelpCircle}
              label="Help Center"
              value="FAQs and tutorials"
              onPress={() => {}}
            />
          </View>

          {/* Logout Section */}
          <View className="mb-10">
            <SettingItem
              icon={LogOut}
              label="Logout"
              onPress={handleLogout}
              isDanger
            />
          </View>

          {/* Footer */}
          <View className="border-t border-gray-800 pt-6 pb-8">
            <Text className="text-gray-500 text-xs text-center mb-2">
              Stylish v1.0.0
            </Text>
            <Text className="text-gray-600 text-xs text-center">
              © 2026 Stylish. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
