import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight, Clock, Users, Zap } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const backgroundColors: readonly [string, string, string] = isDark ? ["#0f172a", "#1e293b", "#1a1a2e"] : ["#f8fafc", "#e2e8f0", "#dbeafe"];
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#D1D5DB" : "#475569";
  const cardBackground = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";
  const cardBorder = isDark ? "rgba(251,191,36,0.2)" : "rgba(251,191,36,0.5)";

  return (
    <LinearGradient
      colors={backgroundColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.topAccent} />

          <View style={styles.heroSection}>
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={["#f59e0b", "#d97706", "#b45309"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={[styles.logoText, { fontFamily: "PlayfairB" }]}>✂</Text>
              </LinearGradient>
              <View style={styles.glow} />
            </View>

            <View style={styles.titleWrap}>
              <Text style={[styles.title, { fontFamily: "PlayfairB", color: textPrimary }]}>
                Stylish
              </Text>
              <View style={styles.titleDivider} />
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Premium Barber Experience
              </Text>
            </View>

            <View style={styles.featuresWrap}>
              <View style={[styles.featureCard, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
                <View style={styles.featureIconWrap}>
                  <Zap size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: textPrimary }]}>Expert Barbers</Text>
                  <Text style={[styles.featureText, { color: textSecondary }]}>
                    Top-rated professionals at your fingertips
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
                <View style={styles.featureIconWrap}>
                  <Clock size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: textPrimary }]}>Instant Booking</Text>
                  <Text style={[styles.featureText, { color: textSecondary }]}>
                    Schedule appointments in seconds
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
                <View style={styles.featureIconWrap}>
                  <Users size={24} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: textPrimary }]}>Trusted Reviews</Text>
                  <Text style={[styles.featureText, { color: textSecondary }]}>
                    Real feedback from verified customers
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionWrap}>
            <TouchableOpacity
              onPress={() => router.push("/auth/register")}
              activeOpacity={0.85}
              style={styles.primaryButtonWrap}
            >
              <LinearGradient
                colors={["#f59e0b", "#d97706"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <ArrowRight size={20} color="white" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.85}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Already Have Account?</Text>
              <Text style={styles.secondaryLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  topAccent: {
    width: 96,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
    marginBottom: 32,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  logoWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoGradient: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoText: {
    fontSize: 64,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  glow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245,158,11,0.18)",
    zIndex: -1,
  },
  titleWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: "700",
    textAlign: "center",
  },
  titleDivider: {
    width: 64,
    height: 4,
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#f59e0b",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  featuresWrap: {
    width: "100%",
    marginTop: 40,
    gap: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  featureIconWrap: {
    marginTop: 2,
    marginRight: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionWrap: {
    gap: 12,
    paddingBottom: 8,
  },
  primaryButtonWrap: {
    shadowColor: "#f59e0b",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "rgba(245,158,11,0.5)",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryLinkText: {
    color: "#fbbf24",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
});
