import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BarberProfileCard from "@/src/components/BarberProfileCard";
import { useAuth } from "@/src/auth/AuthContext";
import { api, type Barber, type BarberPost, type Service, type ServicePackage } from "@/src/lib/api";
import "../global.css";

const ACCENT = "#FFBE0B";
const PAGE_SIZE = 8;

const formatPrice = (price: number) =>
  `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;

const formatPostTime = (value: string) => {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
};

const greetingForHour = (hour: number) => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function isBarberOpenNow(barber: Barber) {
  const now = new Date();
  if (barber.operatingDays && !barber.operatingDays.includes(now.getDay())) return false;
  const minutes = (time: string) => {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < minutes(barber.startTime) || current >= minutes(barber.endTime)) return false;
  return !(barber.pauseStartTime && barber.pauseEndTime
    && current >= minutes(barber.pauseStartTime)
    && current < minutes(barber.pauseEndTime));
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-4 flex-row items-end justify-between px-5">
      <View className="min-w-0 flex-1">
        {eyebrow ? (
          <Text className="text-[9px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">{eyebrow}</Text>
        ) : null}
        <Text className="mt-1 text-[21px] font-PlayfairB text-white">{title}</Text>
      </View>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} className="ml-3 flex-row items-center pb-1">
          <Text className="text-xs font-bold text-[#FFBE0B]">{action}</Text>
          <MaterialIcons name="chevron-right" size={18} color={ACCENT} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function LoadingCard({ width }: { width: number }) {
  return (
    <View
      className="mr-3 overflow-hidden rounded-[26px] border border-white/5 bg-[#191A1A]"
      style={{ width }}
    >
      <View className="h-[150px] bg-white/[0.05]" />
      <View className="p-4">
        <View className="h-3 w-2/3 rounded-full bg-white/[0.08]" />
        <View className="mt-3 h-2.5 w-1/2 rounded-full bg-white/[0.06]" />
      </View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const barberCardWidth = Math.min(width - 48, 350);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [posts, setPosts] = useState<BarberPost[]>([]);
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [barberError, setBarberError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BarberPost | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollViewInstance>(null);
  const bannerWidth = Math.max(280, width - 40);
  const promoCount = Math.min(packages.length, 5);

  const loadHome = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    const [barberResult, packageResult, postResult] = await Promise.allSettled([
      api.getBarbers(),
      api.getPackages(),
      api.getPosts({ limit: PAGE_SIZE, offset: 0 }),
    ]);

    if (barberResult.status === "fulfilled") {
      setBarbers(barberResult.value.barbers);
      setBarberError(null);
    } else {
      setBarberError(barberResult.reason instanceof Error
        ? barberResult.reason.message
        : "Could not load barbers.");
    }

    if (packageResult.status === "fulfilled") {
      setPackages(packageResult.value.packages);
      setPackageError(null);
    } else {
      setPackageError(packageResult.reason instanceof Error
        ? packageResult.reason.message
        : "Could not load packages.");
    }

    if (postResult.status === "fulfilled") {
      setPosts(postResult.value.posts);
      setPostsOffset(postResult.value.nextOffset);
      setHasMorePosts(postResult.value.hasMore);
      setPostsError(null);
    } else {
      setPostsError(postResult.reason instanceof Error
        ? postResult.reason.message
        : "Could not load latest styles.");
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void loadHome(); }, 0);
    return () => clearTimeout(timer);
  }, [loadHome]);

  useEffect(() => {
    if (promoCount < 2) return;
    const timer = setInterval(() => {
      setBannerIndex((current) => {
        const next = (current + 1) % promoCount;
        bannerRef.current?.scrollTo({ x: next * (bannerWidth + 12), animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerWidth, promoCount]);

  const locationOptions = useMemo(
    () => [...new Set(barbers.map((barber) => barber.location.trim()).filter(Boolean))].sort(),
    [barbers],
  );
  const visibleBarbers = useMemo(() => {
    const filtered = location
      ? barbers.filter((barber) => barber.location.toLowerCase().includes(location.toLowerCase()))
      : barbers;
    return [...filtered].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [barbers, location]);
  const recommendedBarbers = useMemo(
    () => [...visibleBarbers].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm).slice(0, 5),
    [visibleBarbers],
  );
  const nearbyBarbers = visibleBarbers.slice(0, 6);
  const popularServices = useMemo(() => {
    const popular = new Map<string, { service: Service; barber: Barber; providerCount: number }>();
    for (const barber of visibleBarbers) {
      for (const service of barber.services) {
        const key = service.name.trim().toLowerCase();
        if (!key) continue;
        const existing = popular.get(key);
        if (existing) existing.providerCount += 1;
        else popular.set(key, { service, barber, providerCount: 1 });
      }
    }
    return [...popular.values()]
      .sort((a, b) => b.providerCount - a.providerCount || a.service.name.localeCompare(b.service.name))
      .slice(0, 8);
  }, [visibleBarbers]);
  const storytellers = useMemo(() => {
    const seen = new Set<string>();
    return posts.filter((post) => {
      if (seen.has(post.barberId)) return false;
      seen.add(post.barberId);
      return true;
    });
  }, [posts]);
  const trendingPosts = posts.slice(0, 4);
  const greeting = greetingForHour(new Date().getHours());
  const firstName = user?.fullName.trim().split(/\s+/)[0] || "there";

  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await api.getPosts({ limit: PAGE_SIZE, offset: postsOffset });
      setPosts((current) => [...current, ...result.posts]);
      setPostsOffset(result.nextOffset);
      setHasMorePosts(result.hasMore);
      setPostsError(null);
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : "Could not load more styles.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const openPackageDetails = (servicePackage: ServicePackage) => {
    router.push(`/package/${servicePackage.id}` as any);
  };

  const bookPackage = (servicePackage: ServicePackage) => {
    if (!servicePackage.services.length) {
      Alert.alert("Package unavailable", "This package has no bookable services.");
      return;
    }
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

  const bookService = (barber: Barber, service: Service) => {
    router.push({
      pathname: "/book/[barberId]/[serviceId]",
      params: { barberId: barber.id, serviceId: service.id, startAtDate: "true" },
    });
  };

  const openVideo = async (post: BarberPost) => {
    const videoUrl = post.mediaUrl;
    if (!videoUrl) {
      Alert.alert("Video unavailable", "This post does not include a playable video link.");
      return;
    }
    try {
      await Linking.openURL(videoUrl);
    } catch (error) {
      Alert.alert("Could not open video", error instanceof Error ? error.message : "Try again later.");
    }
  };

  return (
    <View className="flex-1 bg-[#111111]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadHome(true)}
            tintColor={ACCENT}
            colors={[ACCENT]}
            progressBackgroundColor="#2A2312"
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={{ paddingTop: insets.top + 10 }}>
          <View className="mb-5 flex-row items-center justify-between px-5">
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-[#FFBE0B]/30 bg-[#2A2312]">
                <MaterialIcons name="content-cut" size={22} color={ACCENT} />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2.4px] text-[#FFBE0B]">STYLISH</Text>
                <Text className="mt-0.5 text-[9px] font-semibold uppercase tracking-[1.4px] text-neutral-500">
                  YOUR STYLE, REFINED
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                accessibilityRole="button"
                accessibilityLabel="Open notifications"
                className="mr-2 h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#191A1A]"
              >
                <MaterialIcons name="notifications-none" size={21} color={ACCENT} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                className="h-10 w-10 items-center justify-center rounded-full border border-[#FFBE0B]/30 bg-[#2A2312]"
              >
                <MaterialIcons name="person-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-5 px-5">
            <Text className="text-sm text-neutral-400">{greeting}, {firstName}</Text>
            <Text className="mt-1 text-[30px] font-PlayfairB leading-9 text-white">
              Find your next look.
            </Text>
            <TouchableOpacity
              onPress={() => setLocationPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Choose location. Current location filter: ${location ?? "All areas"}`}
              className="mt-3 flex-row items-center self-start rounded-full border border-white/10 bg-[#191A1A] px-3 py-2"
            >
              <MaterialIcons name="place" size={15} color={ACCENT} />
              <Text className="ml-1.5 text-xs font-medium text-neutral-200" numberOfLines={1}>
                {location ?? "All areas"}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={17} color="#A3A3A3" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/search")}
            accessibilityRole="button"
            accessibilityLabel="Search barbers, services, and offers"
            activeOpacity={0.85}
            className="mx-5 mb-7 flex-row items-center rounded-2xl border border-white/10 bg-[#191A1A] px-4 py-3.5"
          >
            <MaterialIcons name="search" size={21} color={ACCENT} />
            <Text className="ml-3 flex-1 text-sm text-neutral-400">Search barbers, services or offers</Text>
            <MaterialIcons name="tune" size={18} color="#A3A3A3" />
          </TouchableOpacity>

          <View className="mb-7">
            <SectionHeading eyebrow="FROM THE BARBER COMMUNITY" title="Latest Styles" />
            {isLoading && !posts.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {[0, 1, 2, 3].map((item) => (
                  <View key={item} className="mr-4 items-center">
                    <View className="h-[66px] w-[66px] rounded-full border-2 border-[#FFBE0B]/40 bg-[#2A2312]" />
                    <View className="mt-2 h-2 w-14 rounded-full bg-white/10" />
                  </View>
                ))}
              </ScrollView>
            ) : storytellers.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {storytellers.map((post) => (
                  <TouchableOpacity
                    key={post.barberId}
                    onPress={() => setSelectedPost(post)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open latest style by ${post.barber.name}`}
                    className="mr-4 w-[72px] items-center"
                  >
                    <View className="h-[66px] w-[66px] items-center justify-center rounded-full border-2 border-[#FFBE0B] p-[3px]">
                      <Image source={{ uri: post.barber.logoUrl }} className="h-full w-full rounded-full" />
                    </View>
                    <Text className="mt-2 w-full text-center text-[10px] font-medium text-neutral-200" numberOfLines={1}>
                      {post.barber.name}
                    </Text>
                    <Text className="mt-0.5 text-[9px] text-neutral-500">{formatPostTime(post.createdAt)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] px-4 py-4">
                <Text className="text-sm font-semibold text-white">
                  {postsError ? "Styles are unavailable right now" : "No new styles just yet"}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-neutral-400">
                  {postsError ?? "Barber posts will appear here as soon as they share their latest work."}
                </Text>
                {postsError ? (
                  <TouchableOpacity onPress={() => void loadHome(true)} className="mt-3 self-start">
                    <Text className="text-xs font-bold text-[#FFBE0B]">Try again</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          <View className="mb-8">
            <SectionHeading
              eyebrow="FRESH FROM THE CHAIR"
              title="Latest posts"
              action={hasMorePosts ? "Load more" : undefined}
              onAction={hasMorePosts ? loadMorePosts : undefined}
            />
            {isLoading && !posts.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {[0, 1].map((item) => <LoadingCard key={item} width={250} />)}
              </ScrollView>
            ) : posts.length ? (
              <>
                <FlatList
                  horizontal
                  data={posts}
                  keyExtractor={(post) => post.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  initialNumToRender={3}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                  renderItem={({ item: post }) => (
                    <View
                      key={post.id}
                      className="mr-3 w-[250px] overflow-hidden rounded-3xl border border-white/10 bg-[#191A1A]"
                    >
                      <TouchableOpacity
                        onPress={() => setSelectedPost(post)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open latest post by ${post.barber.name}`}
                      >
                        <View className="relative">
                          {post.beforeImageUrl ? (
                            <View className="h-[165px] flex-row">
                              <Image source={{ uri: post.beforeImageUrl }} className="h-full flex-1" resizeMode="cover" />
                              <Image source={{ uri: post.imageUrl }} className="h-full flex-1" resizeMode="cover" />
                            </View>
                          ) : (
                            <Image source={{ uri: post.imageUrl }} className="h-[165px] w-full" resizeMode="cover" />
                          )}
                          {post.mediaType === "video" ? (
                            <View className="absolute inset-0 items-center justify-center">
                              <MaterialIcons name="play-circle-filled" size={40} color="#FFFFFF" />
                            </View>
                          ) : null}
                          {post.beforeImageUrl ? (
                            <View className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1">
                              <Text className="text-[8px] font-bold uppercase text-white">Transformation</Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push(`/barber/${post.barber.id}`)}
                        className="flex-row items-center p-3"
                        accessibilityRole="button"
                        accessibilityLabel={`Visit ${post.barber.name}'s profile`}
                      >
                        <Image source={{ uri: post.barber.logoUrl }} className="h-9 w-9 rounded-full" />
                        <View className="ml-2.5 min-w-0 flex-1">
                          <Text className="text-xs font-bold text-white" numberOfLines={1}>{post.barber.name}</Text>
                          <Text className="mt-1 text-[9px] text-neutral-500">
                            {formatPostTime(post.createdAt)} · {post.barber.location}
                          </Text>
                        </View>
                        <MaterialIcons name="arrow-forward" size={17} color={ACCENT} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                <View className="mt-3 flex-row items-center justify-center">
                  {postsError ? (
                    <Text className="mr-3 text-[10px] text-neutral-400">{postsError}</Text>
                  ) : null}
                  {hasMorePosts ? (
                    <TouchableOpacity
                      onPress={() => void loadMorePosts()}
                      disabled={isLoadingMore}
                      className="flex-row items-center rounded-full border border-[#FFBE0B]/35 bg-[#2A2312] px-4 py-2"
                    >
                      {isLoadingMore ? <ActivityIndicator size="small" color={ACCENT} /> : null}
                      <Text className="ml-1.5 text-[10px] font-bold text-[#FFBE0B]">
                        {isLoadingMore ? "Loading" : "Load more posts"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            ) : (
              <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
                <Text className="text-sm font-semibold text-white">No posts yet</Text>
                <Text className="mt-1 text-xs leading-5 text-neutral-400">
                  The latest barber photos and videos will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mb-8">
          <SectionHeading
            eyebrow="A LITTLE SOMETHING EXTRA"
            title="Offers for you"
            action="All offers"
            onAction={() => router.push("/(tabs)/search")}
          />
          {isLoading && !packages.length ? (
            <View className="mx-5 h-[205px] rounded-3xl border border-white/10 bg-[#191A1A] p-5">
              <View className="h-6 w-24 rounded-full bg-white/10" />
              <View className="mt-14 h-5 w-2/3 rounded-full bg-white/10" />
            </View>
          ) : packageError && !packages.length ? (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm text-neutral-300">{packageError}</Text>
              <TouchableOpacity onPress={() => void loadHome(true)} className="mt-3 self-start">
                <Text className="text-xs font-bold text-[#FFBE0B]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : packages.length ? (
            <>
              <ScrollView
                ref={bannerRef}
                horizontal
                pagingEnabled
                snapToInterval={bannerWidth + 12}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (bannerWidth + 12));
                  setBannerIndex(Math.min(index, packages.length - 1));
                }}
              >
                {packages.slice(0, 5).map((servicePackage) => (
                  <ImageBackground
                    key={servicePackage.id}
                    source={{ uri: servicePackage.imageUrl }}
                    resizeMode="cover"
                    imageStyle={{ borderRadius: 26 }}
                    className="mr-3 h-[210px] overflow-hidden rounded-[26px] border border-[#FFBE0B]/40 bg-[#2A2312]"
                    style={{ width: bannerWidth }}
                  >
                    <LinearGradient
                      colors={["rgba(14,12,8,0.12)", "rgba(14,12,8,0.42)", "rgba(14,12,8,0.94)"]}
                      locations={[0, 0.42, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                    <View className="flex-1 justify-between p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="rounded-full bg-[#FFBE0B] px-3 py-1.5">
                          <Text className="text-[9px] font-bold uppercase tracking-wider text-[#2A2312]">
                            SAVE {servicePackage.discountPercent}%
                          </Text>
                        </View>
                        <View className="flex-row items-center rounded-full border border-white/30 bg-[#2A2312]/75 px-2.5 py-1.5">
                          <MaterialIcons name="content-cut" size={12} color={ACCENT} />
                          <Text className="ml-1 text-[9px] font-bold text-white">
                            {servicePackage.services.length} SERVICES
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-end justify-between">
                        <Pressable
                          onPress={() => openPackageDetails(servicePackage)}
                          className="mr-3 min-w-0 flex-1"
                          accessibilityRole="button"
                          accessibilityLabel={`View ${servicePackage.title} details`}
                        >
                          <Text className="text-[9px] font-bold uppercase tracking-[1.8px] text-white/65">
                            {servicePackage.barber.name}
                          </Text>
                          <Text className="mt-1 text-xl font-PlayfairB text-white" numberOfLines={1}>
                            {servicePackage.title}
                          </Text>
                          <View className="mt-1.5 flex-row items-center">
                            <Text className="text-[10px] text-white/55 line-through">
                              {formatPrice(servicePackage.originalPrice)}
                            </Text>
                            <Text className="ml-2 text-sm font-bold text-[#FFBE0B]">
                              {formatPrice(servicePackage.finalPrice)}
                            </Text>
                          </View>
                        </Pressable>
                        <TouchableOpacity
                          onPress={() => bookPackage(servicePackage)}
                          accessibilityRole="button"
                          accessibilityLabel={`Book ${servicePackage.title}`}
                          className="flex-row items-center rounded-full bg-[#FFBE0B] px-3.5 py-2.5"
                        >
                          <Text className="mr-1 text-[10px] font-bold text-[#2A2312]">Book Now</Text>
                          <MaterialIcons name="arrow-forward" size={14} color="#2A2312" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ImageBackground>
                ))}
              </ScrollView>
              {packages.length > 1 ? (
                <View className="mt-3 flex-row justify-center">
                  {packages.slice(0, 5).map((servicePackage, index) => (
                    <View
                      key={servicePackage.id}
                      className={`mx-1 h-1.5 rounded-full ${index === bannerIndex ? "w-5 bg-[#FFBE0B]" : "w-1.5 bg-white/25"}`}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm font-semibold text-white">No packages available</Text>
              <Text className="mt-1 text-xs text-neutral-400">Explore individual services from barbers near you.</Text>
            </View>
          )}
        </View>

        <View className="mb-8">
          <SectionHeading
            eyebrow="THE BARBER MENU"
            title="Popular services"
            action="Explore"
            onAction={() => router.push("/(tabs)/search")}
          />
          {isLoading && !barbers.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[0, 1, 2].map((item) => <LoadingCard key={item} width={176} />)}
            </ScrollView>
          ) : popularServices.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {popularServices.map(({ service, barber }) => (
                <TouchableOpacity
                  key={`${barber.id}-${service.id}`}
                  onPress={() => bookService(barber, service)}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${service.name} with ${barber.name} for ${formatPrice(service.price)}`}
                  activeOpacity={0.82}
                  className="mr-3 w-[178px] overflow-hidden rounded-3xl border border-white/10 bg-[#191A1A]"
                >
                  {service.imageUrl ? (
                    <ImageBackground
                      source={{ uri: service.imageUrl }}
                      className="h-[112px] justify-end"
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.8)"]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
                      />
                      <View className="p-3">
                        <Text className="text-sm font-bold text-white" numberOfLines={1}>{service.name}</Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View className="h-[112px] items-center justify-center bg-[#2A2312]">
                      <MaterialIcons name="content-cut" size={29} color={ACCENT} />
                    </View>
                  )}
                  <View className="p-3">
                    <Text className="text-[9px] text-neutral-500" numberOfLines={1}>{barber.name}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-[#FFBE0B]">{formatPrice(service.price)}</Text>
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={12} color="#A3A3A3" />
                        <Text className="ml-1 text-[9px] text-neutral-400">{service.durationMinutes} min</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : barberError ? (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm text-neutral-300">{barberError}</Text>
              <TouchableOpacity onPress={() => void loadHome(true)} className="mt-3 self-start">
                <Text className="text-xs font-bold text-[#FFBE0B]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm font-semibold text-white">No services available yet</Text>
              <Text className="mt-1 text-xs text-neutral-400">Services will appear here as barbers add them.</Text>
            </View>
          )}
        </View>

        <View className="mb-8">
          <SectionHeading
            eyebrow="HAND-PICKED FOR YOU"
            title="Recommended barbers"
            action="View All"
            onAction={() => router.push("/(tabs)/search")}
          />
          {isLoading && !barbers.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[0, 1, 2].map((item) => <LoadingCard key={item} width={barberCardWidth} />)}
            </ScrollView>
          ) : barberError && !barbers.length ? (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm text-neutral-300">{barberError}</Text>
              <TouchableOpacity onPress={() => void loadHome(true)} className="mt-3 self-start">
                <Text className="text-xs font-bold text-[#FFBE0B]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : recommendedBarbers.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {recommendedBarbers.map((barber) => (
                <BarberProfileCard
                  key={`recommended-${barber.id}`}
                  barber={barber}
                  onPress={() => router.push(`/barber/${barber.id}`)}
                  style={{ width: barberCardWidth, marginRight: 12 }}
                  height={280}
                  showStartingPrice
                />
              ))}
            </ScrollView>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm text-neutral-300">
                {location ? `No barbers found in ${location}.` : "No barbers are available right now."}
              </Text>
              {location ? (
                <TouchableOpacity onPress={() => setLocation(null)} className="mt-3 self-start">
                  <Text className="text-xs font-bold text-[#FFBE0B]">Show all areas</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        <View className="mb-8">
          <SectionHeading eyebrow="FRESH INSPIRATION" title="Trending haircuts" action="Latest Styles" onAction={() => {
            if (posts.length) setSelectedPost(posts[0]);
          }} />
          {trendingPosts.length ? (
            <View className="flex-row flex-wrap justify-between px-5">
              {trendingPosts.map((post) => (
                <Pressable
                  key={`trend-${post.id}`}
                  onPress={() => setSelectedPost(post)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open haircut post by ${post.barber.name}`}
                  className="mb-3 w-[48.5%] overflow-hidden rounded-2xl border border-white/10 bg-[#191A1A]"
                >
                  <View className="relative">
                    {post.beforeImageUrl ? (
                      <View className="h-[150px] flex-row">
                        <Image source={{ uri: post.beforeImageUrl }} className="h-full flex-1" resizeMode="cover" />
                        <Image source={{ uri: post.imageUrl }} className="h-full flex-1" resizeMode="cover" />
                      </View>
                    ) : (
                      <Image source={{ uri: post.imageUrl }} className="h-[150px] w-full" resizeMode="cover" />
                    )}
                    {post.beforeImageUrl ? (
                      <View className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1">
                        <Text className="text-[8px] font-bold uppercase text-white">Before & after</Text>
                      </View>
                    ) : null}
                    {post.mediaType === "video" ? (
                      <View className="absolute inset-0 items-center justify-center">
                        <MaterialIcons name="play-circle-filled" size={42} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/barber/${post.barber.id}`)}
                    className="flex-row items-center p-2.5"
                    accessibilityRole="button"
                    accessibilityLabel={`View ${post.barber.name}'s profile`}
                  >
                    <Image source={{ uri: post.barber.logoUrl }} className="h-7 w-7 rounded-full" />
                    <View className="ml-2 min-w-0 flex-1">
                      <Text className="text-[10px] font-semibold text-white" numberOfLines={1}>
                        {post.barber.name}
                      </Text>
                      <Text className="mt-0.5 text-[9px] text-neutral-500">{formatPostTime(post.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm font-semibold text-white">New looks are on the way</Text>
              <Text className="mt-1 text-xs leading-5 text-neutral-400">
                Published haircut photos and transformations will be featured here.
              </Text>
            </View>
          )}
        </View>

        <View className="mb-3">
          <SectionHeading
            eyebrow={location ?? "BASED ON BARBER LOCATIONS"}
            title="Nearby barbers"
            action="See All"
            onAction={() => router.push("/(tabs)/search")}
          />
          {nearbyBarbers.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {nearbyBarbers.map((barber) => {
                const isOpen = isBarberOpenNow(barber);
                return (
                  <TouchableOpacity
                    key={`nearby-${barber.id}`}
                    onPress={() => router.push(`/barber/${barber.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${barber.name}, ${barber.distanceKm.toFixed(1)} kilometers away, rated ${barber.rating.toFixed(1)}`}
                    activeOpacity={0.84}
                    className="mr-3 w-[265px] flex-row items-center rounded-3xl border border-white/10 bg-[#191A1A] p-3"
                  >
                    <Image source={{ uri: barber.logoUrl }} className="h-[66px] w-[66px] rounded-2xl" />
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-sm font-bold text-white" numberOfLines={1}>{barber.name}</Text>
                      <Text className="mt-1 text-[10px] text-neutral-400" numberOfLines={1}>{barber.location}</Text>
                      <View className="mt-2 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <MaterialIcons name="star" size={13} color={ACCENT} />
                          <Text className="ml-1 text-[10px] font-bold text-white">{barber.rating.toFixed(1)}</Text>
                          <Text className="ml-2 text-[9px] text-neutral-500">{barber.distanceKm.toFixed(1)} km</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className={`mr-1 h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-neutral-500"}`} />
                          <Text className={`text-[9px] font-semibold ${isOpen ? "text-emerald-300" : "text-neutral-500"}`}>
                            {isOpen ? "Open now" : "Closed"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : !isLoading && !barberError ? (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#191A1A] p-5">
              <Text className="text-sm text-neutral-300">No nearby barbers are available for this area.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={locationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <Pressable
          onPress={() => setLocationPickerVisible(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="rounded-t-[30px] border-t border-[#FFBE0B]/25 bg-[#151515] px-5 pb-8 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">DISCOVER LOCALLY</Text>
                <Text className="mt-1 text-xl font-PlayfairB text-white">Choose an area</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLocationPickerVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
                accessibilityLabel="Close location selector"
              >
                <MaterialIcons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                setLocation(null);
                setLocationPickerVisible(false);
              }}
              className="mb-2 flex-row items-center rounded-2xl border border-white/10 bg-[#1D1D1D] p-4"
            >
              <MaterialIcons name="public" size={19} color={ACCENT} />
              <Text className="ml-3 flex-1 text-sm font-semibold text-white">All areas</Text>
              {!location ? <MaterialIcons name="check" size={18} color={ACCENT} /> : null}
            </TouchableOpacity>
            {locationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setLocation(option);
                  setLocationPickerVisible(false);
                }}
                className="mb-2 flex-row items-center rounded-2xl border border-white/10 bg-[#1D1D1D] p-4"
              >
                <MaterialIcons name="place" size={19} color={ACCENT} />
                <Text className="ml-3 flex-1 text-sm font-semibold text-white" numberOfLines={1}>{option}</Text>
                {location === option ? <MaterialIcons name="check" size={18} color={ACCENT} /> : null}
              </TouchableOpacity>
            ))}
            {!locationOptions.length && isLoading ? (
              <View className="items-center py-5">
                <ActivityIndicator color={ACCENT} />
                <Text className="mt-2 text-xs text-neutral-400">Loading available areas…</Text>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={selectedPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost ? (
          <View className="flex-1 justify-center bg-black/95 px-4" style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}>
            <View className="mb-4 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setSelectedPost(null);
                  router.push(`/barber/${selectedPost.barber.id}`);
                }}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel={`View ${selectedPost.barber.name}'s profile`}
              >
                <Image source={{ uri: selectedPost.barber.logoUrl }} className="h-11 w-11 rounded-full border border-[#FFBE0B]" />
                <View className="ml-3">
                  <Text className="text-sm font-bold text-white">{selectedPost.barber.name}</Text>
                  <Text className="mt-0.5 text-[10px] text-neutral-400">{formatPostTime(selectedPost.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                accessibilityLabel="Close post"
              >
                <MaterialIcons name="close" size={23} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#191A1A]">
              <View className="relative">
                {selectedPost.beforeImageUrl ? (
                  <View className="flex-row">
                    <Image
                      source={{ uri: selectedPost.beforeImageUrl }}
                      resizeMode="contain"
                      style={{ height: Math.min(width * 1.15, 560), width: "50%" }}
                    />
                    <Image
                      source={{ uri: selectedPost.imageUrl }}
                      resizeMode="contain"
                      style={{ height: Math.min(width * 1.15, 560), width: "50%" }}
                    />
                  </View>
                ) : (
                  <Image
                    source={{ uri: selectedPost.imageUrl }}
                    resizeMode="contain"
                    style={{ height: Math.min(width * 1.15, 560), width: "100%" }}
                  />
                )}
                {selectedPost.beforeImageUrl ? (
                  <View className="absolute bottom-3 left-3 right-3 flex-row">
                    <View className="mr-2 flex-1 rounded-xl bg-black/75 p-2">
                      <Text className="text-center text-[9px] font-bold uppercase text-white">Before</Text>
                    </View>
                    <View className="flex-1 rounded-xl bg-black/75 p-2">
                      <Text className="text-center text-[9px] font-bold uppercase text-white">After</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <View className="p-4">
                <Text className="text-sm font-semibold text-white">
                  {selectedPost.beforeImageUrl ? "Before & after transformation" : "Latest work"}
                </Text>
                <Text className="mt-1 text-xs text-neutral-400">{selectedPost.barber.location}</Text>
                {selectedPost.mediaType === "video" ? (
                  <TouchableOpacity
                    onPress={() => void openVideo(selectedPost)}
                    className="mt-4 flex-row items-center justify-center rounded-xl bg-[#2A2312] py-3"
                    accessibilityRole="button"
                    accessibilityLabel="Play barber video"
                  >
                    <MaterialIcons name="play-arrow" size={19} color={ACCENT} />
                    <Text className="ml-1 text-xs font-bold text-[#FFBE0B]">Play Video</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPost(null);
                    router.push(`/barber/${selectedPost.barber.id}`);
                  }}
                  className="mt-3 flex-row items-center justify-center rounded-xl bg-[#FFBE0B] py-3"
                  accessibilityRole="button"
                  accessibilityLabel={`View ${selectedPost.barber.name}'s profile`}
                >
                  <MaterialIcons name="person-outline" size={18} color="#2A2312" />
                  <Text className="ml-2 text-xs font-bold text-[#2A2312]">Visit Barber Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}
