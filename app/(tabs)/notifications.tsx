import { LinearGradient } from "expo-linear-gradient";
import { Bell, CalendarClock, ChevronRight, Sparkles, TicketPercent } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
  {
    id: "1",
    title: "Booking confirmed",
    description: "Your haircut with Ahmed was confirmed for tomorrow at 11:00 AM.",
    time: "2h ago",
    icon: CalendarClock,
    accent: "#f59e0b",
  },
  {
    id: "2",
    title: "Special offer",
    description: "20% off premium beard grooming this weekend.",
    time: "Yesterday",
    icon: TicketPercent,
    accent: "#22c55e",
  },
  {
    id: "3",
    title: "New stylist match",
    description: "We found 3 barbers that match your preferred style.",
    time: "2 days ago",
    icon: Sparkles,
    accent: "#a78bfa",
  },
];

export default function NotificationsScreen() {
  return (
    <LinearGradient colors={["#0f172a", "#111827", "#0f172a"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Your latest updates and reminders.</Text>
          </View>

          <View style={styles.listWrap}>
            {notifications.map((item) => {
              const Icon = item.icon;

              return (
                <TouchableOpacity key={item.id} activeOpacity={0.8} style={styles.card}>
                  <View style={[styles.iconWrap, { backgroundColor: `${item.accent}20` }]}>
                    <Icon size={22} color={item.accent} strokeWidth={1.8} />
                  </View>

                  <View style={styles.textWrap}>
                    <View style={styles.row}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>

                  <ChevronRight size={18} color="#9ca3af" strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.emptyCard}>
            <Bell size={20} color="#f59e0b" strokeWidth={1.8} />
            <Text style={styles.emptyText}>You’re all caught up.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  headerWrap: { marginBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 36, fontWeight: "700", marginBottom: 6, fontFamily: "PlayfairB" },
  headerSubtitle: { color: "#9ca3af", fontSize: 15 },
  listWrap: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.7)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.7)",
    padding: 14,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  textWrap: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  time: { color: "#9ca3af", fontSize: 11 },
  description: { color: "#d1d5db", fontSize: 12, lineHeight: 18 },
  emptyCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.5)",
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.7)",
    borderRadius: 16,
    paddingVertical: 14,
  },
  emptyText: { color: "#f59e0b", fontWeight: "600", marginLeft: 8 },
});
