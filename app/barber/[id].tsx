import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";
import ServicePackageCard from "@/src/components/ServicePackageCard";
import { api, type Barber, type BarberWork, type ServicePackage } from "@/src/lib/api";
import "../global.css";

const ACCENT = "#FFBE0B";
const INK = "#2A2312";
const CONTENT = "#111111";

type ProfileTab = "work" | "services" | "reviews";

type BarberLoadState = {
  id: string | null;
  attempt: number;
  status: "loading" | "ready" | "error";
  barber?: Barber;
  error?: string;
};

type PackageLoadState = {
  id: string | null;
  status: "loading" | "ready" | "error";
  packages: ServicePackage[];
  error?: string;
};

const formatPrice = (price: number) =>
  `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="items-center rounded-3xl border border-[#FFBE0B]/20 bg-[#191A1A] px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2A2312]">
        <MaterialIcons name={icon} size={26} color={ACCENT} />
      </View>
      <Text className="mt-4 text-base font-bold text-white">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-neutral-400">{description}</Text>
    </View>
  );
}

export default function BarberProfile() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const [loadState, setLoadState] = useState<BarberLoadState>({
    id: null,
    attempt: -1,
    status: "loading",
  });
  const [packageLoadState, setPackageLoadState] = useState<PackageLoadState>({
    id: null,
    status: "loading",
    packages: [],
  });
  const [packageRetry, setPackageRetry] = useState(0);
  const [selection, setSelection] = useState<{ barberId: string; serviceIds: string[] } | null>(null);
  const [favoriteState, setFavoriteState] = useState<{ id: string | undefined; isFollowing: boolean }>({
    id: undefined,
    isFollowing: false,
  });
  const [followPending, setFollowPending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ProfileTab>("work");
  const [selectedWork, setSelectedWork] = useState<BarberWork | null>(null);
  const [entrance] = useState(() => new Animated.Value(0));
  const [tabEntrance] = useState(() => new Animated.Value(1));
  const [buttonScale] = useState(() => new Animated.Value(1));

  const barber = loadState.id === id && loadState.status === "ready" ? loadState.barber ?? null : null;
  const isLoading = Boolean(id) && (
    loadState.id !== id || loadState.attempt !== retryCount || loadState.status === "loading"
  );
  const loadError = id
    ? loadState.id === id && loadState.status === "error"
      ? loadState.error
      : null
    : "A barber was not selected.";
  const selectedServiceIds = useMemo(
    () => barber && selection?.barberId === barber.id
      ? selection.serviceIds
      : [],
    [barber, selection],
  );
  const selectedServices = useMemo(
    () => barber?.services.filter((service) => selectedServiceIds.includes(service.id)) ?? [],
    [barber, selectedServiceIds],
  );
  const selectedTotal = selectedServices.reduce((total, service) => total + service.price, 0);
  const specialty = barber?.services.slice(0, 2).map((service) => service.name).join(" · ")
    || "Barber & grooming";
  const startingHourlyPrice = barber?.services.length
    ? Math.min(...barber.services.map((service) => service.price * 60 / service.durationMinutes))
    : null;
  const heroHeight = Math.min(480, Math.max(390, width * 1.05));
  const work = barber?.work ?? [];
  const barberPackages = packageLoadState.id === id && packageLoadState.status === "ready"
    ? packageLoadState.packages
    : [];
  const packagesLoading = Boolean(id) && (
    packageLoadState.id !== id || packageLoadState.status === "loading"
  );
  const packagesError = packageLoadState.id === id && packageLoadState.status === "error"
    ? packageLoadState.error
    : null;
  const reviews = barber?.reviews ?? [];
  const averageReviewRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : barber?.rating ?? 0;
  const reviewDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(review.rating) === rating).length,
  }));
  const highestDistributionCount = Math.max(1, ...reviewDistribution.map((item) => item.count));
  const contentWidth = Math.max(0, width - 40);
  const workTileWidth = Math.max(0, (contentWidth - 12) / 2);

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };

    api.getBarber(id)
      .then(({ barber: result }) => {
        if (!active) return;
        setLoadState({ id, attempt: retryCount, status: "ready", barber: result });
        setSelection({ barberId: result.id, serviceIds: [] });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadState({
          id,
          attempt: retryCount,
          status: "error",
          error: error instanceof Error ? error.message : "Could not load this barber.",
        });
      });

    if (user?.role === "customer") {
      api.getFavorites()
        .then(({ barbers }) => {
          if (active) setFavoriteState({ id, isFollowing: barbers.some((item) => item.id === id) });
        })
        .catch(() => {
          if (active) setFavoriteState({ id, isFollowing: false });
        });
    }

    return () => {
      active = false;
    };
  }, [id, retryCount, user?.id, user?.role]);

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };

    api.getPackages()
      .then(({ packages }) => {
        if (active) {
          setPackageLoadState({
            id,
            status: "ready",
            packages: packages.filter((servicePackage) => servicePackage.barberId === id),
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPackageLoadState({
          id,
          status: "error",
          packages: [],
          error: error instanceof Error ? error.message : "Could not load this barber's packages.",
        });
      });

    return () => {
      active = false;
    };
  }, [id, packageRetry]);

  useEffect(() => {
    if (!barber) return;
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [barber, entrance]);

  useEffect(() => {
    tabEntrance.setValue(0.65);
    Animated.timing(tabEntrance, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabEntrance]);

  const toggleFollow = async () => {
    if (!id || followPending) return;
    setFollowPending(true);
    try {
      const result = await api.toggleFavorite(id);
      setFavoriteState({ id, isFollowing: result.saved });
    } catch (error) {
      Alert.alert(
        "Could not update favorites",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setFollowPending(false);
    }
  };

  const toggleService = (serviceId: string) => {
    if (!barber) return;
    const selected = selectedServiceIds.includes(serviceId);
    setSelection({
      barberId: barber.id,
      serviceIds: selected
        ? selectedServiceIds.filter((selectedId) => selectedId !== serviceId)
        : [...selectedServiceIds, serviceId],
    });
  };

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      speed: 26,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const bookSelectedServices = () => {
    if (!barber || !selectedServiceIds.length) return;
    router.push({
      pathname: "/book/[barberId]/[serviceId]",
      params: {
        barberId: barber.id,
        serviceId: selectedServiceIds[0],
        services: selectedServiceIds.join(","),
        startAtDate: "true",
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111]">
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-4 text-sm text-neutral-300">Loading barber profile…</Text>
      </View>
    );
  }

  if (!barber) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <MaterialIcons name="content-cut" size={40} color={ACCENT} />
        <Text className="mt-4 text-center text-lg font-PlayfairB text-white">Barber unavailable</Text>
        <Text className="mt-2 text-center text-sm text-neutral-400">
          {loadError ?? "This barber profile could not be found."}
        </Text>
        <TouchableOpacity
          onPress={() => setRetryCount((count) => count + 1)}
          className="mt-6 rounded-full bg-[#FFBE0B] px-6 py-3"
          accessibilityRole="button"
        >
          <Text className="font-bold text-[#17130A]">Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <Text className="font-semibold text-neutral-300">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#111111]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View
            className="overflow-hidden bg-[#2A2312]"
            style={{ height: heroHeight, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <ImageBackground
              source={{ uri: barber.services.find((service) => service.imageUrl)?.imageUrl ?? barber.logoUrl }}
              resizeMode="cover"
              className="absolute inset-0"
            >
              <LinearGradient
                colors={["#17140F", "rgba(23,20,15,0.82)", "rgba(23,20,15,0.16)"]}
                locations={[0, 0.48, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              />
            </ImageBackground>
            <Image
              source={{ uri: barber.logoUrl }}
              resizeMode="cover"
              style={{
                position: "absolute",
                right: -14,
                bottom: 0,
                width: width * 0.57,
                height: heroHeight * 0.78,
                borderTopLeftRadius: 130,
                opacity: 0.96,
              }}
            />
            <LinearGradient
              colors={["#17140F", "rgba(23,20,15,0.97)", "rgba(23,20,15,0.05)"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              pointerEvents="none"
            />

            <View
              className="flex-row items-center justify-between px-5"
              style={{ paddingTop: insets.top + 10 }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              {user?.role === "customer" ? (
                <TouchableOpacity
                  onPress={() => void toggleFollow()}
                  disabled={followPending}
                  className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35"
                  accessibilityRole="button"
                  accessibilityLabel={favoriteState.isFollowing ? "Remove barber from favorites" : "Add barber to favorites"}
                  accessibilityState={{ disabled: followPending, selected: favoriteState.isFollowing }}
                >
                  <MaterialIcons
                    name={favoriteState.isFollowing ? "favorite" : "favorite-border"}
                    size={21}
                    color={favoriteState.isFollowing ? ACCENT : "#FFFFFF"}
                  />
                </TouchableOpacity>
              ) : <View className="h-11 w-11" />}
            </View>

            <View className="mt-auto max-w-[74%] px-5 pb-7">
              <View className="mb-3 self-start rounded-full border border-[#FFBE0B]/50 bg-[#2A2312]/90 px-3 py-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FFBE0B]">
                  STYLISH BARBER
                </Text>
              </View>
              <Text className="text-[32px] font-PlayfairB leading-9 text-white" numberOfLines={2}>
                {barber.name}
              </Text>
              <Text className="mt-1.5 text-xs font-medium text-neutral-300" numberOfLines={1}>
                {specialty}
              </Text>
              <View className="mt-3 flex-row items-center">
                <MaterialIcons name="star" size={16} color={ACCENT} />
                <Text className="ml-1 text-sm font-bold text-white">{barber.rating.toFixed(1)}</Text>
                <View className="mx-2 h-1 w-1 rounded-full bg-white/40" />
                <MaterialIcons name="place" size={14} color={ACCENT} />
                <Text className="ml-1 flex-1 text-xs text-neutral-200" numberOfLines={1}>
                  {barber.location}
                </Text>
              </View>
              <View className="mt-3 self-start rounded-full border border-white/15 bg-black/30 px-3 py-1.5">
                <Text className="text-[10px] font-semibold text-white">
                  {startingHourlyPrice === null
                    ? "Pricing available on request"
                    : `From ${formatPrice(startingHourlyPrice)} / hr`}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row border-b border-white/10 bg-[#111111] px-3">
            {([
              { id: "work", label: "My Latest Work", icon: "photo-library" },
              { id: "services", label: "Services", icon: "content-cut" },
              { id: "reviews", label: "Reviews", icon: "star-outline" },
            ] as const).map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`flex-1 items-center border-b-[3px] px-1 pb-3 pt-4 ${
                    selected ? "border-[#FFBE0B]" : "border-transparent"
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={tab.label}
                >
                  <MaterialIcons name={tab.icon} size={18} color={selected ? ACCENT : "#737373"} />
                  <Text
                    className={`mt-1 text-[10px] font-bold ${
                      selected ? "text-[#FFBE0B]" : "text-neutral-500"
                    }`}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View
            style={{
              opacity: tabEntrance,
              transform: [{ translateY: tabEntrance.interpolate({ inputRange: [0.65, 1], outputRange: [6, 0] }) }],
              backgroundColor: CONTENT,
              minHeight: 360,
              paddingHorizontal: 20,
              paddingTop: 22,
              paddingBottom: 28,
            }}
          >
            {activeTab === "work" ? (
              <View>
                <View className="mb-4 flex-row items-end justify-between">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#FFBE0B]">
                      THE PORTFOLIO
                    </Text>
                    <Text className="mt-1 text-2xl font-PlayfairB text-white">My Latest Work</Text>
                  </View>
                  {work.length > 0 ? (
                    <Text className="pb-1 text-xs text-neutral-400">{work.length} looks</Text>
                  ) : null}
                </View>
                {work.length ? (
                  <View className="flex-row flex-wrap justify-between">
                    {work.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedWork(item)}
                        accessibilityRole="button"
                        accessibilityLabel={item.beforeImageUrl ? "View before and after transformation" : "View barber work"}
                        className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#191A1A]"
                        style={{ width: workTileWidth }}
                      >
                        {item.beforeImageUrl ? (
                          <View className="flex-row">
                            {[{ uri: item.beforeImageUrl }, { uri: item.imageUrl }].map((source, index) => (
                              <View key={`${item.id}-${index}`} className="relative flex-1">
                                <Image source={source} className="h-[150px] w-full" resizeMode="cover" />
                                <View className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1">
                                  <Text className="text-[8px] font-bold uppercase text-white">
                                    {index === 0 ? "Before" : "After"}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Image source={{ uri: item.imageUrl }} className="h-[170px] w-full" resizeMode="cover" />
                        )}
                        <View className="flex-row items-center justify-between px-3 py-2.5">
                          <Text className="text-[10px] font-semibold text-neutral-300" numberOfLines={1}>
                            {item.beforeImageUrl ? "Transformation" : "Fresh from the chair"}
                          </Text>
                          <MaterialIcons name="fullscreen" size={17} color={ACCENT} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="photo-library"
                    title="The portfolio is taking shape"
                    description="New cuts and before-and-after transformations will appear here when the barber publishes their work."
                  />
                )}
              </View>
            ) : null}

            {activeTab === "services" ? (
              <View>
                <View className="mt-8">
                  <View className="mb-4 flex-row items-end justify-between">
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#FFBE0B]">
                        EXCLUSIVE DEALS
                      </Text>
                      <Text className="mt-1 text-2xl font-PlayfairB text-white">Packages & offers</Text>
                    </View>
                    {barberPackages.length ? (
                      <Text className="pb-1 text-xs text-neutral-400">
                        {barberPackages.length} {barberPackages.length === 1 ? "offer" : "offers"}
                      </Text>
                    ) : null}
                  </View>
                  {packagesLoading ? (
                    <View className="items-center rounded-2xl border border-white/10 bg-[#191A1A] py-7">
                      <ActivityIndicator color={ACCENT} />
                      <Text className="mt-3 text-xs text-neutral-400">Loading packages…</Text>
                    </View>
                  ) : packagesError ? (
                    <View className="rounded-2xl border border-red-500/25 bg-[#191A1A] p-5">
                      <Text className="text-sm font-semibold text-white">Could not load packages</Text>
                      <Text className="mt-1 text-xs leading-5 text-neutral-400">{packagesError}</Text>
                      <TouchableOpacity
                        onPress={() => setPackageRetry((count) => count + 1)}
                        className="mt-3 self-start rounded-full bg-[#FFBE0B] px-4 py-2"
                      >
                        <Text className="text-xs font-bold text-[#2A2312]">Try again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : barberPackages.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 8 }}
                    >
                      {barberPackages.map((servicePackage) => (
                        <ServicePackageCard
                          key={servicePackage.id}
                          pack={servicePackage}
                          variant="package"
                          onPress={() => router.push(`/package/${servicePackage.id}` as any)}
                          onBarberPress={() => router.push(`/barber/${barber.id}`)}
                          style={{ width: Math.min(width - 60, 320), marginRight: 12 }}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View className="rounded-2xl border border-white/10 bg-[#191A1A] p-5">
                      <Text className="text-sm font-semibold text-white">No packages available</Text>
                      <Text className="mt-1 text-xs leading-5 text-neutral-400">
                        Check out the individual services above and build the visit that suits you.
                      </Text>
                    </View>
                  )}
                </View>
                <View className="mb-4 flex-row items-end justify-between">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#FFBE0B]">
                      THE MENU
                    </Text>
                    <Text className="mt-1 text-2xl font-PlayfairB text-white">Choose your service</Text>
                  </View>
                  <Text className="pb-1 text-xs text-neutral-400">
                    {selectedServiceIds.length} selected
                  </Text>
                </View>
                {barber.services.length ? (
                  <View className="gap-3">
                    {barber.services.map((service) => {
                      const selected = selectedServiceIds.includes(service.id);
                      return (
                        <TouchableOpacity
                          key={service.id}
                          onPress={() => toggleService(service.id)}
                          activeOpacity={0.82}
                          className={`flex-row items-center rounded-2xl border p-3 ${
                            selected ? "border-[#FFBE0B] bg-[#2A2312]" : "border-white/10 bg-[#191A1A]"
                          }`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={`${service.name}, ${formatPrice(service.price)}, ${service.durationMinutes} minutes`}
                        >
                          {service.imageUrl ? (
                            <Image
                              source={{ uri: service.imageUrl }}
                              className="h-[58px] w-[58px] rounded-xl"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="h-[58px] w-[58px] items-center justify-center rounded-xl bg-[#2A2312]">
                              <MaterialIcons name="content-cut" size={23} color={ACCENT} />
                            </View>
                          )}
                          <View className="ml-3 min-w-0 flex-1">
                            <Text className="text-sm font-bold text-white" numberOfLines={2}>
                              {service.name}
                            </Text>
                            <View className="mt-1.5 flex-row items-center">
                              <MaterialIcons name="schedule" size={13} color={ACCENT} />
                              <Text className="ml-1 text-xs text-neutral-400">
                                {service.durationMinutes} min
                              </Text>
                            </View>
                          </View>
                          <View className="ml-2 items-end">
                            <Text className={`text-sm font-bold ${selected ? "text-[#FFBE0B]" : "text-white"}`}>
                              {formatPrice(service.price)}
                            </Text>
                            <View
                              className={`mt-2 h-5 w-5 items-center justify-center rounded-full border ${
                                selected ? "border-[#FFBE0B] bg-[#FFBE0B]" : "border-neutral-600"
                              }`}
                            >
                              {selected ? <MaterialIcons name="check" size={14} color={INK} /> : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <EmptyState
                    icon="content-cut"
                    title="No services listed yet"
                    description="This barber has not added bookable services. Check back soon."
                  />
                )}

                
              </View>
            ) : null}

            {activeTab === "reviews" ? (
              <View>
                <View className="mb-4">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#FFBE0B]">
                    CLIENT NOTES
                  </Text>
                  <Text className="mt-1 text-2xl font-PlayfairB text-white">Reviews</Text>
                </View>
                <View className="mb-4 flex-row items-center rounded-3xl border border-[#FFBE0B]/20 bg-[#191A1A] p-5">
                  <View className="mr-5 items-center">
                    <Text className="text-4xl font-PlayfairB text-white">{averageReviewRating.toFixed(1)}</Text>
                    <View className="mt-1 flex-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name={averageReviewRating >= star - 0.5 ? "star" : "star-border"}
                          size={14}
                          color="#D8A600"
                        />
                      ))}
                    </View>
                    <Text className="mt-1 text-[9px] text-neutral-400">
                      {reviews.length ? `${reviews.length} reviews` : "Barber rating"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    {reviewDistribution.map(({ rating, count }) => (
                      <View key={rating} className="mb-1.5 flex-row items-center">
                        <Text className="w-3 text-[9px] font-semibold text-neutral-400">{rating}</Text>
                        <MaterialIcons name="star" size={10} color="#D8A600" />
                        <View className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <View
                            className="h-full rounded-full bg-[#FFBE0B]"
                            style={{ width: `${(count / highestDistributionCount) * 100}%` }}
                          />
                        </View>
                        <Text className="w-4 text-right text-[9px] text-neutral-400">{count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {reviews.length ? (
                  <View className="gap-3">
                    {reviews.map((review) => (
                      <View key={review.id} className="rounded-2xl border border-white/10 bg-[#191A1A] p-4">
                        <View className="flex-row items-center">
                          {review.customerImageUrl ? (
                            <Image
                              source={{ uri: review.customerImageUrl }}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#2A2312]">
                              <MaterialIcons name="person" size={21} color={ACCENT} />
                            </View>
                          )}
                          <View className="ml-3 min-w-0 flex-1">
                            <Text className="text-sm font-bold text-white" numberOfLines={1}>
                              {review.customerName}
                            </Text>
                            <Text className="mt-0.5 text-[10px] text-neutral-400">
                              {formatDate(review.createdAt)}
                            </Text>
                          </View>
                          <View className="flex-row items-center rounded-full bg-[#2A2312] px-2 py-1">
                            <MaterialIcons name="star" size={13} color="#D8A600" />
                            <Text className="ml-1 text-xs font-bold text-[#FFBE0B]">
                              {review.rating.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-3 text-sm leading-5 text-neutral-300">{review.comment}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="rate-review"
                    title="No reviews yet"
                    description="When customers share their experience, their ratings and comments will show here."
                  />
                )}
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#111111] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="flex-row items-center">
          <View className="mr-4 min-w-0 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-neutral-400">
              {selectedServices.length
                ? `${selectedServices.length} ${selectedServices.length === 1 ? "service" : "services"} selected`
                : "Select a service"}
            </Text>
            <Text className="mt-1 text-lg font-PlayfairB text-[#FFBE0B]">
              {selectedServices.length ? formatPrice(selectedTotal) : "—"}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={bookSelectedServices}
              onPressIn={() => animateButton(0.97)}
              onPressOut={() => animateButton(1)}
              disabled={!selectedServiceIds.length}
              accessibilityRole="button"
              accessibilityLabel={selectedServiceIds.length
                ? `Book appointment with ${barber.name} for ${formatPrice(selectedTotal)}`
                : "Choose a service to book"}
              className={`min-w-[176px] flex-row items-center justify-center rounded-full px-5 py-4 ${
                selectedServiceIds.length ? "bg-[#FFBE0B]" : "bg-[#D8D4CA]"
              }`}
            >
              <Text className="mr-2 text-sm font-bold text-[#2A2312]">Book Appointment</Text>
              <MaterialIcons name="arrow-forward" size={17} color="#2A2312" />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <Modal
        visible={selectedWork !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedWork(null)}
      >
        <View className="flex-1 items-center justify-center bg-black">
          <TouchableOpacity
            onPress={() => setSelectedWork(null)}
            className="absolute right-5 z-10 h-11 w-11 items-center justify-center rounded-full bg-white/15"
            style={{ top: insets.top + 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close gallery"
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedWork?.beforeImageUrl ? (
            <View className="w-full flex-row">
              {[{ uri: selectedWork.beforeImageUrl }, { uri: selectedWork.imageUrl }].map((source, index) => (
                <View key={`${selectedWork.id}-fullscreen-${index}`} className="relative flex-1">
                  <Image source={source} style={{ height: height * 0.68, width: "100%" }} resizeMode="contain" />
                  <Text className="absolute bottom-4 self-center rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white">
                    {index === 0 ? "BEFORE" : "AFTER"}
                  </Text>
                </View>
              ))}
            </View>
          ) : selectedWork ? (
            <Image source={{ uri: selectedWork.imageUrl }} style={{ height: height * 0.8, width: "100%" }} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
