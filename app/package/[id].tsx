import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type ServicePackage } from "@/src/lib/api";
import "../global.css";

const ACCENT = "#FFBE0B";

type PackageLoadState = {
  id: string | null;
  status: "loading" | "ready" | "error";
  servicePackage?: ServicePackage;
  error?: string;
};

const formatPrice = (price: number) =>
  `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
};

export default function ServicePackageDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loadState, setLoadState] = useState<PackageLoadState>({
    id: null,
    status: "loading",
  });
  const [entrance] = useState(() => new Animated.Value(0));
  const [buttonScale] = useState(() => new Animated.Value(1));

  const servicePackage = loadState.id === id && loadState.status === "ready"
    ? loadState.servicePackage ?? null
    : null;
  const isLoading = Boolean(id) && (
    loadState.id !== id || loadState.status === "loading"
  );
  const loadError = id
    ? loadState.id === id && loadState.status === "error"
      ? loadState.error
      : null
    : "A service package was not selected.";
  const specialty = useMemo(
    () => servicePackage?.services.slice(0, 2).map((service) => service.name).join(" · ")
      || "Barber & grooming",
    [servicePackage],
  );
  const heroHeight = Math.min(460, Math.max(340, width * 0.96));

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };

    api.getPackage(id)
      .then(({ servicePackage: result }) => {
        if (active) setLoadState({ id, status: "ready", servicePackage: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadState({
          id,
          status: "error",
          error: error instanceof Error ? error.message : "Could not load this package.",
        });
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entrance, servicePackage]);

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      speed: 26,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const bookPackage = () => {
    if (!servicePackage?.services.length) return;
    router.push({
      pathname: "/book/[barberId]/[serviceId]",
      params: {
        barberId: servicePackage.barber.id,
        serviceId: servicePackage.services[0].id,
        services: servicePackage.services.map((service) => service.id).join(","),
        packageId: servicePackage.id,
        totalPrice: String(servicePackage.finalPrice),
        durationMinutes: String(servicePackage.durationMinutes),
      },
    });
  };

  if (isLoading || (!servicePackage && !loadError)) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111]">
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-4 text-sm text-neutral-300">Loading package details…</Text>
      </View>
    );
  }

  if (!servicePackage) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <MaterialIcons name="content-cut" size={40} color={ACCENT} />
        <Text className="mt-4 text-center text-lg font-PlayfairB text-white">Package unavailable</Text>
        <Text className="mt-2 text-center text-sm text-neutral-400">
          {loadError ?? "Could not load this package."}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-full bg-[#FFBE0B] px-6 py-3">
          <Text className="font-bold text-[#17130A]">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#111111]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <ImageBackground
            source={{ uri: servicePackage.imageUrl }}
            resizeMode="cover"
            style={{ height: heroHeight }}
          >
            <LinearGradient
              colors={["rgba(10,9,7,0.5)", "rgba(10,9,7,0.12)", "#111111"]}
              locations={[0, 0.48, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View
              className="flex-row items-center justify-between px-5"
              style={{ paddingTop: insets.top + 10 }}
            >
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35"
              >
                <MaterialIcons name="arrow-back" size={21} color="#FFFFFF" />
              </Pressable>
              <View className="rounded-full bg-[#FFBE0B] px-4 py-2">
                <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#2A2312]">
                  Save {servicePackage.discountPercent}%
                </Text>
              </View>
            </View>

            <View className="mt-auto px-5 pb-7">
              <View className="mb-3 flex-row items-center self-start rounded-full border border-white/20 bg-black/35 px-3 py-1.5">
                <MaterialIcons name="star" size={15} color={ACCENT} />
                <Text className="ml-1 text-xs font-bold text-white">
                  {servicePackage.barber.rating.toFixed(1)}
                </Text>
                <Text className="ml-1.5 text-[10px] text-white/70">barber rating</Text>
              </View>
              <Text className="text-[30px] font-PlayfairB leading-9 text-white" numberOfLines={2}>
                {servicePackage.title}
              </Text>
              <View className="mt-3 flex-row items-end justify-between">
                <Text className="text-sm text-white/75" numberOfLines={1}>
                  By {servicePackage.barber.name}
                </Text>
                <View className="items-end">
                  <Text className="text-xs text-white/55 line-through">
                    {formatPrice(servicePackage.originalPrice)}
                  </Text>
                  <Text className="mt-0.5 text-2xl font-PlayfairB text-[#FFBE0B]">
                    {formatPrice(servicePackage.finalPrice)}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>

          <View className="px-5">
            <View className="mb-7 rounded-3xl border border-[#FFBE0B]/20 bg-[#2A2312] p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">
                    Made for your next visit
                  </Text>
                  <Text className="mt-1 text-lg font-PlayfairB text-white">Included services</Text>
                </View>
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <Text className="text-[10px] font-bold text-white">
                    {servicePackage.services.length} SERVICES
                  </Text>
                </View>
              </View>
              {servicePackage.services.map((service, index) => (
                <View
                  key={service.id}
                  className={`flex-row items-center py-4 ${
                    index < servicePackage.services.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <View className="h-[58px] w-[58px] overflow-hidden rounded-2xl bg-[#17140C]">
                    {service.imageUrl ? (
                      <Image source={{ uri: service.imageUrl }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <MaterialIcons name="content-cut" size={22} color={ACCENT} />
                      </View>
                    )}
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-sm font-bold text-white" numberOfLines={1}>
                      {service.name}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-neutral-400" numberOfLines={2}>
                      {`${service.name} by ${servicePackage.barber.name}.`}
                    </Text>
                    <View className="mt-1.5 flex-row items-center">
                      <MaterialIcons name="schedule" size={12} color={ACCENT} />
                      <Text className="ml-1 text-[10px] text-neutral-300">
                        {formatDuration(service.durationMinutes)}
                      </Text>
                    </View>
                  </View>
                  <Text className="ml-2 text-sm font-bold text-[#FFBE0B]">
                    {formatPrice(service.price)}
                  </Text>
                </View>
              ))}
              <View className="mt-2 flex-row items-center justify-between border-t border-[#FFBE0B]/20 pt-4">
                <Text className="text-xs font-semibold text-neutral-300">Total visit duration</Text>
                <Text className="text-sm font-bold text-white">
                  {formatDuration(servicePackage.durationMinutes)}
                </Text>
              </View>
            </View>

            <View className="mb-7">
              <Text className="mb-3 text-lg font-PlayfairB text-white">Your barber</Text>
              <Pressable
                onPress={() => router.push(`/barber/${servicePackage.barber.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`View ${servicePackage.barber.name}'s profile`}
                className="flex-row items-center rounded-3xl border border-white/10 bg-[#191A1A] p-4"
              >
                <Image
                  source={{ uri: servicePackage.barber.logoUrl }}
                  className="h-[68px] w-[68px] rounded-2xl"
                  resizeMode="cover"
                />
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-base font-PlayfairB text-white" numberOfLines={1}>
                    {servicePackage.barber.name}
                  </Text>
                  <View className="mt-1.5 flex-row items-center">
                    <MaterialIcons name="star" size={14} color={ACCENT} />
                    <Text className="ml-1 text-xs font-bold text-white">
                      {servicePackage.barber.rating.toFixed(1)}
                    </Text>
                    <Text className="ml-2 flex-1 text-[10px] text-neutral-400" numberOfLines={1}>
                      {specialty}
                    </Text>
                  </View>
                  <View className="mt-1.5 flex-row items-center">
                    <MaterialIcons name="place" size={13} color={ACCENT} />
                    <Text className="ml-1 flex-1 text-xs text-neutral-400" numberOfLines={1}>
                      {servicePackage.barber.location}
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={23} color="#FFBE0B" />
              </Pressable>
            </View>

            <View className="mb-5 rounded-3xl border border-[#FFBE0B]/25 bg-[#2A2312] p-5">
              <Text className="mb-4 text-lg font-PlayfairB text-white">Package summary</Text>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-neutral-300">Original price</Text>
                <Text className="text-sm text-white">{formatPrice(servicePackage.originalPrice)}</Text>
              </View>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-neutral-300">Package price</Text>
                <Text className="text-sm font-bold text-[#FFBE0B]">
                  {formatPrice(servicePackage.finalPrice)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-neutral-300">You save</Text>
                <Text className="text-sm font-bold text-[#FFBE0B]">
                  {formatPrice(servicePackage.savings)}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between border-t border-white/10 pt-4">
                <Text className="text-sm text-neutral-300">Total duration</Text>
                <Text className="text-sm font-bold text-white">
                  {formatDuration(servicePackage.durationMinutes)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        className="border-t border-white/10 bg-[#111111] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            onPress={bookPackage}
            onPressIn={() => animateButton(0.98)}
            onPressOut={() => animateButton(1)}
            accessibilityRole="button"
            accessibilityLabel={`Book ${servicePackage.title} for ${formatPrice(servicePackage.finalPrice)}`}
            className="flex-row items-center justify-center rounded-2xl bg-[#FFBE0B] py-4"
          >
            <MaterialIcons name="event-available" size={19} color="#2A2312" />
            <Text className="ml-2 text-sm font-bold text-[#2A2312]">Book This Package</Text>
            <Text className="ml-2 text-xs font-semibold text-[#2A2312]/75">
              · {formatPrice(servicePackage.finalPrice)}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
