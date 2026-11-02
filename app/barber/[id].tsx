import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";
import { api, type Barber, type Service } from "@/src/lib/api";
import "../global.css";

const formatPrice = (price: number) =>
  `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;

type BarberLoadState = {
  id: string | null;
  attempt: number;
  status: "loading" | "ready" | "error";
  barber?: Barber;
  error?: string;
};

export default function BarberProfile() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [loadState, setLoadState] = useState<BarberLoadState>({
    id: null,
    attempt: -1,
    status: "loading",
  });
  const [selection, setSelection] = useState<{ barberId: string; serviceId: string | null } | null>(null);
  const [favoriteState, setFavoriteState] = useState<{ id: string | undefined; isFollowing: boolean }>({
    id: undefined,
    isFollowing: false,
  });
  const [followPending, setFollowPending] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [entrance] = useState(() => new Animated.Value(0));
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
  const selectedServiceId = barber && selection?.barberId === barber.id
    ? selection.serviceId
    : barber?.services[0]?.id ?? null;
  const isFollowing = user?.role === "customer" && favoriteState.id === id && favoriteState.isFollowing;

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };

    api.getBarber(id)
      .then(({ barber: result }) => {
        if (!active) return;
        setLoadState({ id, attempt: retryCount, status: "ready", barber: result });
        setSelection({ barberId: result.id, serviceId: result.services[0]?.id ?? null });
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
        .catch((error: unknown) => {
          if (active) {
            Alert.alert(
              "Favorites unavailable",
              error instanceof Error ? error.message : "Could not load your saved barbers.",
            );
          }
        });
    }

    return () => {
      active = false;
    };
  }, [id, retryCount, user?.id, user?.role]);

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [barber, entrance]);

  const selectedService = useMemo(
    () => barber?.services.find((service) => service.id === selectedServiceId) ?? null,
    [barber, selectedServiceId],
  );
  const specialty = barber?.services.slice(0, 2).map((service) => service.name).join(" · ")
    || "Barber & grooming";
  const description = barber
    ? barber.description?.trim()
      || (barber.services.length
        ? `${barber.name} offers ${barber.services.map((service) => service.name).join(", ")} at ${barber.location}. Choose a service to see its price and estimated duration before booking.`
        : `${barber.name} is based in ${barber.location}. Check back soon for available services.`)
    : "";
  const coverHeight = Math.min(440, Math.max(330, width * 0.96));

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

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      speed: 26,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const bookSelectedService = (service: Service | null) => {
    if (!barber || !service) return;
    router.push({
      pathname: "/book/[barberId]/[serviceId]",
      params: { barberId: barber.id, serviceId: service.id },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111]">
        <ActivityIndicator size="large" color="#FFBE0B" />
        <Text className="mt-4 text-sm text-neutral-300">Loading barber profile…</Text>
      </View>
    );
  }

  if (!barber) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <MaterialIcons name="content-cut" size={40} color="#FFBE0B" />
        <Text className="mt-4 text-center text-lg font-PlayfairB text-white">
          Barber unavailable
        </Text>
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
        contentContainerStyle={{ paddingBottom: 132 + insets.bottom }}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          }}
        >
          <ImageBackground
            source={{ uri: barber.services.find((service) => service.imageUrl)?.imageUrl ?? barber.logoUrl }}
            resizeMode="cover"
            style={[styles.cover, { height: coverHeight }]}
            imageStyle={styles.coverImage}
          >
            <LinearGradient
              colors={["rgba(10,10,10,0.3)", "rgba(10,10,10,0.04)", "rgba(10,10,10,0.92)"]}
              locations={[0, 0.42, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.coverActions, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              {user?.role === "customer" && (
                <TouchableOpacity
                  onPress={() => void toggleFollow()}
                  disabled={followPending}
                  className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45"
                  accessibilityRole="button"
                  accessibilityLabel={isFollowing ? "Remove barber from favorites" : "Add barber to favorites"}
                  accessibilityState={{ disabled: followPending, selected: isFollowing }}
                >
                  <MaterialIcons
                    name={isFollowing ? "favorite" : "favorite-border"}
                    size={21}
                    color={isFollowing ? "#FFBE0B" : "#FFFFFF"}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View className="px-5 pb-6">
              <View className="mb-3 self-start rounded-full border border-[#FFBE0B]/50 bg-[#2A2312]/90 px-3 py-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FFBE0B]">
                  Stylish barber
                </Text>
              </View>
              <Text className="text-3xl font-PlayfairB text-white" numberOfLines={2}>
                {barber.name}
              </Text>
              <Text className="mt-1.5 text-sm font-medium text-neutral-200" numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          </ImageBackground>

          <View className="px-5 pt-5">
            <View className="mb-7 flex-row items-center">
              <View className="mr-3 flex-row items-center rounded-full border border-[#FFBE0B]/30 bg-[#2A2312] px-3 py-2">
                <MaterialIcons name="star" size={17} color="#FFBE0B" />
                <Text className="ml-1.5 text-sm font-bold text-white">{barber.rating.toFixed(1)}</Text>
                <Text className="ml-1 text-xs text-neutral-300">rating</Text>
              </View>
              <View className="min-w-0 flex-1 flex-row items-center">
                <MaterialIcons name="place" size={18} color="#FFBE0B" />
                <Text className="ml-1.5 flex-1 text-sm text-neutral-300" numberOfLines={2}>
                  {barber.location}
                </Text>
              </View>
            </View>

            <View className="mb-7">
              <View className="mb-4 flex-row items-end justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">
                    The menu
                  </Text>
                  <Text className="mt-1 text-2xl font-PlayfairB text-white">Choose a service</Text>
                </View>
                <Text className="pb-1 text-xs text-neutral-400">
                  {barber.services.length} {barber.services.length === 1 ? "service" : "services"}
                </Text>
              </View>

              {barber.services.length > 0 ? (
                <View className="gap-3">
                  {barber.services.map((service) => {
                    const selected = service.id === selectedServiceId;
                    return (
                      <TouchableOpacity
                        key={service.id}
                        onPress={() => setSelection({ barberId: barber.id, serviceId: service.id })}
                        activeOpacity={0.82}
                        className={`flex-row items-center rounded-2xl border p-3 ${
                          selected
                            ? "border-[#FFBE0B] bg-[#2A2312]"
                            : "border-white/10 bg-[#191A1A]"
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${service.name}, ${formatPrice(service.price)}, ${service.durationMinutes} minutes`}
                      >
                        {service.imageUrl ? (
                          <Image
                            source={{ uri: service.imageUrl }}
                            className="h-[68px] w-[68px] rounded-xl"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-[68px] w-[68px] items-center justify-center rounded-xl bg-[#24201A]">
                            <MaterialIcons name="content-cut" size={25} color="#FFBE0B" />
                          </View>
                        )}
                        <View className="ml-3 min-w-0 flex-1">
                          <Text className="text-base font-semibold text-white" numberOfLines={2}>
                            {service.name}
                          </Text>
                          <View className="mt-2 flex-row items-center">
                            <MaterialIcons name="schedule" size={14} color="#A3A3A3" />
                            <Text className="ml-1 text-xs text-neutral-400">
                              {service.durationMinutes} min
                            </Text>
                          </View>
                        </View>
                        <View className="ml-2 items-end">
                          <Text className={`text-base font-bold ${selected ? "text-[#FFBE0B]" : "text-white"}`}>
                            {formatPrice(service.price)}
                          </Text>
                          <View
                            className={`mt-2 h-5 w-5 items-center justify-center rounded-full border ${
                              selected ? "border-[#FFBE0B] bg-[#FFBE0B]" : "border-neutral-500"
                            }`}
                          >
                            {selected && <MaterialIcons name="check" size={14} color="#17130A" />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="rounded-2xl border border-white/10 bg-[#191A1A] p-5">
                  <Text className="text-sm text-neutral-300">
                    No services are available to book right now.
                  </Text>
                </View>
              )}
            </View>

            <View className="rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">
                About the barber
              </Text>
              <Text
                className="mt-3 text-sm leading-6 text-neutral-300"
                numberOfLines={isDescriptionExpanded ? undefined : 3}
              >
                {description}
              </Text>
              {description.length > 120 && (
                <TouchableOpacity
                  onPress={() => setIsDescriptionExpanded((expanded) => !expanded)}
                  className="mt-2 self-start py-1"
                  accessibilityRole="button"
                  accessibilityLabel={isDescriptionExpanded ? "Show less about the barber" : "Read more about the barber"}
                >
                  <Text className="text-sm font-bold text-[#FFBE0B]">
                    {isDescriptionExpanded ? "Read Less" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.bookingBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#111111]/95 px-5 pt-3"
      >
        <View className="flex-row items-center">
          <View className="mr-4 min-w-0 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400">
              {selectedService ? selectedService.name : "Select a service"}
            </Text>
            <Text className="mt-1 text-lg font-PlayfairB text-[#FFBE0B]">
              {selectedService ? formatPrice(selectedService.price) : "—"}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={() => bookSelectedService(selectedService)}
              onPressIn={() => animateButton(0.97)}
              onPressOut={() => animateButton(1)}
              disabled={!selectedService}
              accessibilityRole="button"
              accessibilityLabel={selectedService ? `Book ${selectedService.name} for ${formatPrice(selectedService.price)}` : "Choose a service to book"}
              className={`min-w-[155px] flex-row items-center justify-center rounded-full px-6 py-4 ${
                selectedService ? "bg-[#FFBE0B]" : "bg-neutral-700"
              }`}
            >
              <Text className="mr-2 text-sm font-bold text-[#17130A]">Book Now</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#17130A" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#2A2312",
  },
  coverImage: {
    borderRadius: 28,
  },
  coverActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  bookingBar: {
    elevation: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
});
