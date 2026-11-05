import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BarberProfileCard from "@/src/components/BarberProfileCard";
import ServicePackageCard from "@/src/components/ServicePackageCard";
import { api, type Barber, type ServicePackage } from "@/src/lib/api";
import { isOpenOnDate } from "@/src/lib/barberSchedule";
import "../global.css";

type SortOption = "recommended" | "nearest" | "rating" | "price";

interface SearchFilters {
  location: string;
  maxDistance: number | null;
  minRating: number;
  selectedServices: string[];
  minPrice: string;
  maxPrice: string;
  availableDate: string;
  availableTime: string;
}

const initialFilters: SearchFilters = {
  location: "",
  maxDistance: null,
  minRating: 0,
  selectedServices: [],
  minPrice: "",
  maxPrice: "",
  availableDate: "",
  availableTime: "",
};

const sortOptions: { key: SortOption; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "nearest", label: "Nearest" },
  { key: "rating", label: "Top Rated" },
  { key: "price", label: "Lowest Price" },
];

const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMinutes = (time: string) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

function hasAvailableTime(
  barber: Barber,
  availability: Awaited<ReturnType<typeof api.getAvailability>>,
  time: string,
) {
  if (!availability.isOpen || !isOpenOnDate(barber.operatingDays, availability.date)) return false;
  if (!time) return true;

  const start = toMinutes(time);
  const open = toMinutes(availability.openingHours.start);
  const close = toMinutes(availability.openingHours.end);
  if (start === null || open === null || close === null || start < open || start + 30 > close) {
    return false;
  }
  if (availability.date === todayKey()) {
    const now = new Date();
    if (start <= now.getHours() * 60 + now.getMinutes()) return false;
  }

  const pauseStart = availability.openingHours.pauseStart
    ? toMinutes(availability.openingHours.pauseStart)
    : null;
  const pauseEnd = availability.openingHours.pauseEnd
    ? toMinutes(availability.openingHours.pauseEnd)
    : null;
  if (pauseStart !== null && pauseEnd !== null && start < pauseEnd && start + 30 > pauseStart) {
    return false;
  }

  return !availability.booked.some((booking) => {
    const bookedStart = toMinutes(booking.startTime);
    const bookedEnd = toMinutes(booking.endTime);
    return bookedStart !== null && bookedEnd !== null && start < bookedEnd && start + 30 > bookedStart;
  });
}

function FilterChip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      className={`mr-2 flex-row items-center rounded-full border px-3.5 py-2.5 ${
        active ? "border-[#FFBE0B] bg-[#2A2312]" : "border-white/10 bg-[#181818]"
      }`}
    >
      {icon && <MaterialIcons name={icon} size={15} color={active ? "#FFBE0B" : "#B8B8B8"} />}
      <Text className={`text-xs font-semibold ${icon ? "ml-1.5" : ""} ${active ? "text-[#FFBE0B]" : "text-neutral-300"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bannerWidth = Math.max(260, width - 40);
  const packageWidth = Math.min(290, width - 60);
  const [query, setQuery] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [draftSortBy, setDraftSortBy] = useState<SortOption>("recommended");
  const [dateValidationError, setDateValidationError] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    let active = true;
    api.getPackages()
      .then(({ packages }) => {
        if (active) setServicePackages(packages);
      })
      .catch(() => {
        if (active) setServicePackages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { barbers: results } = await api.getBarbers({
          q: query.trim() || undefined,
          city: filters.location.trim() || undefined,
          maxDistance: filters.maxDistance ?? undefined,
          minRating: filters.minRating || undefined,
        });

        let visibleResults = results;
        if (filters.availableDate) {
          const availability = await Promise.all(
            results.map(async (barber) => ({
              barber,
              slots: await api.getAvailability(barber.id, filters.availableDate),
            })),
          );
          visibleResults = availability
            .filter(({ barber, slots }) => hasAvailableTime(barber, slots, filters.availableTime))
            .map(({ barber }) => barber);
        }

        if (active) setBarbers(visibleResults);
      } catch (error) {
        if (active) {
          setBarbers([]);
          setLoadError(error instanceof Error ? error.message : "Could not load barbers.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    filters.availableDate,
    filters.availableTime,
    filters.location,
    filters.maxDistance,
    filters.minRating,
    query,
    retryCount,
  ]);

  const serviceNames = useMemo(
    () => [...new Set(barbers.flatMap((barber) => barber.services.map((service) => service.name)))].sort(),
    [barbers],
  );

  const sortedBarbers = useMemo(() => {
    const filtered = barbers.filter((barber) => {
      if (filters.selectedServices.length > 0) {
        const names = barber.services.map((service) => service.name);
        if (!filters.selectedServices.some((name) => names.includes(name))) return false;
      }
      const startingPrice = Math.min(...barber.services.map((service) => service.price));
      const minPrice = filters.minPrice.trim() ? Number(filters.minPrice) : null;
      const maxPrice = filters.maxPrice.trim() ? Number(filters.maxPrice) : null;
      if (minPrice !== null && startingPrice < minPrice) return false;
      if (maxPrice !== null && startingPrice > maxPrice) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest") return a.distanceKm - b.distanceKm;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") {
        const aPrice = Math.min(...a.services.map((service) => service.price));
        const bPrice = Math.min(...b.services.map((service) => service.price));
        return aPrice - bPrice;
      }
      return b.rating - a.rating || a.distanceKm - b.distanceKm;
    });
  }, [barbers, filters.maxPrice, filters.minPrice, filters.selectedServices, sortBy]);

  const promotions = useMemo(
    () => servicePackages.filter((pack) => {
      const search = query.trim().toLowerCase();
      return !search || `${pack.title} ${pack.description} ${pack.barber.name}`.toLowerCase().includes(search);
    }).slice(0, 2),
    [query, servicePackages],
  );
  const popularPackages = useMemo(
    () => servicePackages.filter((pack) => {
      const search = query.trim().toLowerCase();
      return (!search || `${pack.title} ${pack.description} ${pack.barber.name}`.toLowerCase().includes(search))
        && !promotions.some((promotion) => promotion.id === pack.id);
    }),
    [promotions, query, servicePackages],
  );
  const featuredBarbers = sortedBarbers.slice(0, 5);
  const activeFilterCount =
    Number(Boolean(filters.location.trim())) +
    Number(filters.maxDistance !== null) +
    Number(filters.minRating > 0) +
    filters.selectedServices.length +
    Number(Boolean(filters.minPrice || filters.maxPrice)) +
    Number(Boolean(filters.availableDate));

  const openFilters = () => {
    setDraftFilters({ ...filters, selectedServices: [...filters.selectedServices] });
    setDraftSortBy(sortBy);
    setDateValidationError("");
    setFiltersVisible(true);
  };

  const updateQuickFilter = (update: Partial<SearchFilters>, nextSort?: SortOption) => {
    setFilters((current) => ({ ...current, ...update }));
    setDraftFilters((current) => ({ ...current, ...update }));
    if (nextSort) {
      setSortBy(nextSort);
      setDraftSortBy(nextSort);
    }
  };

  const clearAll = () => {
    setQuery("");
    setFilters(initialFilters);
    setDraftFilters(initialFilters);
    setSortBy("recommended");
    setDraftSortBy("recommended");
    setDateValidationError("");
  };

  const applyFilters = () => {
    const date = draftFilters.availableDate.trim();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateValidationError("Enter a date in YYYY-MM-DD format.");
      return;
    }
    if (date) {
      const parsedDate = new Date(`${date}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime())) {
        setDateValidationError("Enter a valid calendar date.");
        return;
      }
      const [year, month, day] = date.split("-").map(Number);
      if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() + 1 !== month ||
        parsedDate.getDate() !== day
      ) {
        setDateValidationError("Enter a valid calendar date.");
        return;
      }
      if (date < todayKey()) {
        setDateValidationError("Choose today or a future date.");
        return;
      }
    }
    if (draftFilters.availableTime && !date) {
      setDateValidationError("Choose an available date before entering a time.");
      return;
    }
    if (draftFilters.availableTime && toMinutes(draftFilters.availableTime) === null) {
      setDateValidationError("Enter a time in 24-hour HH:mm format.");
      return;
    }
    if (draftFilters.minPrice && (!Number.isFinite(Number(draftFilters.minPrice)) || Number(draftFilters.minPrice) < 0)) {
      setDateValidationError("Enter a valid minimum price.");
      return;
    }
    if (draftFilters.maxPrice && (!Number.isFinite(Number(draftFilters.maxPrice)) || Number(draftFilters.maxPrice) < 0)) {
      setDateValidationError("Enter a valid maximum price.");
      return;
    }
    if (
      draftFilters.minPrice &&
      draftFilters.maxPrice &&
      Number(draftFilters.minPrice) > Number(draftFilters.maxPrice)
    ) {
      setDateValidationError("Minimum price must not exceed maximum price.");
      return;
    }
    setFilters({
      ...draftFilters,
      location: draftFilters.location.trim(),
      availableDate: date,
      availableTime: draftFilters.availableTime.trim(),
    });
    setSortBy(draftSortBy);
    setDateValidationError("");
    setFiltersVisible(false);
  };

  const toggleDraftService = (name: string) => {
    setDraftFilters((current) => ({
      ...current,
      selectedServices: current.selectedServices.includes(name)
        ? current.selectedServices.filter((service) => service !== name)
        : [...current.selectedServices, name],
    }));
  };

  const renderPackage = (
    pack: ServicePackage,
    variant: "promotion" | "package",
    cardWidth: number,
  ) => (
    <ServicePackageCard
      key={`${variant}-${pack.id}`}
      pack={pack}
      variant={variant}
      onPress={() => router.push(`/package/${pack.id}` as any)}
      onBarberPress={() => router.push(`/barber/${pack.barber.id}`)}
      style={{ width: cardWidth, marginRight: 12 }}
    />
  );

  return (
    <View className="flex-1 bg-[#111111]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="px-5 pb-4 pt-5">
          <View className="mb-5 flex-row items-end justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[2.5px] text-[#FFBE0B]">
                STYLISH · DISCOVER
              </Text>
              <Text className="mt-1 text-[30px] font-PlayfairB leading-9 text-white">
                Find your barber
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Great style starts with the right hands.
              </Text>
            </View>
            <View className="mb-1 h-11 w-11 items-center justify-center rounded-2xl border border-[#FFBE0B]/25 bg-[#2A2312]">
              <MaterialIcons name="content-cut" size={21} color="#FFBE0B" />
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl border border-white/10 bg-[#1B1B1B] px-3.5">
            <MaterialIcons name="search" size={21} color="#FFBE0B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => setRetryCount((count) => count + 1)}
              returnKeyType="search"
              placeholder="Barber, service or style"
              placeholderTextColor="#858585"
              className="h-[54px] min-w-0 flex-1 px-3 text-sm text-white"
              accessibilityLabel="Search barbers and services"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} accessibilityLabel="Clear search">
                <MaterialIcons name="close" size={19} color="#9B9B9B" />
              </TouchableOpacity>
            )}
            <View className="mx-3 h-6 w-px bg-white/10" />
            <TouchableOpacity
              onPress={openFilters}
              className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFBE0B]"
              accessibilityRole="button"
              accessibilityLabel="Open advanced filters"
            >
              <MaterialIcons name="tune" size={20} color="#2A2312" />
              {activeFilterCount > 0 && (
                <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#1B1B1B] bg-white px-1">
                  <Text className="text-[9px] font-bold text-[#2A2312]">{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-3 flex-row items-center rounded-xl border border-white/10 bg-[#181818] px-3">
            <MaterialIcons name="place" size={18} color="#FFBE0B" />
            <TextInput
              value={filters.location}
              onChangeText={(location) => updateQuickFilter({ location })}
              placeholder="Location or city"
              placeholderTextColor="#858585"
              className="h-11 flex-1 px-2.5 text-sm text-white"
              accessibilityLabel="Search by location"
            />
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              LOCATION
            </Text>
          </View>
        </View>

        <View className="mb-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <FilterChip
              label="Nearby"
              icon="near-me"
              active={filters.maxDistance === 5}
              onPress={() => updateQuickFilter({ maxDistance: filters.maxDistance === 5 ? null : 5 }, "nearest")}
            />
            <FilterChip
              label="Rating 4+"
              icon="star"
              active={filters.minRating >= 4}
              onPress={() => updateQuickFilter({ minRating: filters.minRating >= 4 ? 0 : 4 })}
            />
            <FilterChip
              label="Price"
              icon="payments"
              active={sortBy === "price"}
              onPress={() => updateQuickFilter({}, sortBy === "price" ? "recommended" : "price")}
            />
            <FilterChip
              label="Availability"
              icon="event-available"
              active={Boolean(filters.availableDate)}
              onPress={() => {
                if (filters.availableDate) {
                  updateQuickFilter({ availableDate: "", availableTime: "" });
                } else {
                  updateQuickFilter({ availableDate: todayKey() });
                }
              }}
            />
            <FilterChip
              label="Specialty"
              icon="content-cut"
              active={filters.selectedServices.length > 0}
              onPress={openFilters}
            />
          </ScrollView>
        </View>

        <View className="mb-7">
          <View className="mb-3 flex-row items-center justify-between px-5">
            <View>
              <Text className="text-xl font-PlayfairB text-white">Offers worth the visit</Text>
              <Text className="mt-1 text-xs text-neutral-500">Curated deals from the Stylish collection</Text>
            </View>
            <View className="rounded-full bg-[#2A2312] px-2.5 py-1.5">
              <Text className="text-[10px] font-bold text-[#FFBE0B]">
                {promotions.length ? `${bannerIndex + 1} / ${promotions.length}` : "OFFERS"}
              </Text>
            </View>
          </View>
          {promotions.length > 0 ? (
            <>
              <ScrollView
                horizontal
                snapToInterval={bannerWidth + 12}
                decelerationRate="fast"
                disableIntervalMomentum
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (bannerWidth + 12));
                  setBannerIndex(Math.min(index, promotions.length - 1));
                }}
              >
                {promotions.map((pack) => renderPackage(pack, "promotion", bannerWidth))}
              </ScrollView>
              {promotions.length > 1 && (
                <View className="mt-3 flex-row justify-center">
                  {promotions.map((pack, index) => (
                    <View
                      key={pack.id}
                      className={`mx-1 h-1.5 rounded-full ${index === bannerIndex ? "w-5 bg-[#FFBE0B]" : "w-1.5 bg-white/25"}`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#181818] p-5">
              <Text className="text-sm text-neutral-400">No offers match this search.</Text>
            </View>
          )}
        </View>

        <View className="mb-8">
          <View className="mb-3 flex-row items-end justify-between px-5">
            <View>
              <Text className="text-xl font-PlayfairB text-white">Popular Packages</Text>
              <Text className="mt-1 text-xs text-neutral-500">A little more care, all in one visit</Text>
            </View>
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-[#FFBE0B]">
              {popularPackages.length} PACKS
            </Text>
          </View>
          {popularPackages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {popularPackages.map((pack) => renderPackage(pack, "package", packageWidth))}
            </ScrollView>
          ) : (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#181818] p-5">
              <Text className="text-sm text-neutral-400">No packages match this search.</Text>
            </View>
          )}
        </View>

        <View className="mb-5">
          <View className="mb-3 flex-row items-end justify-between px-5">
            <View>
              <Text className="text-xl font-PlayfairB text-white">Top Barbers Near You</Text>
              <View className="mt-1 flex-row items-center">
                <Text className="text-xs text-neutral-500">
                  {sortedBarbers.length} {sortedBarbers.length === 1 ? "barber" : "barbers"} to explore
                </Text>
                {loading && barbers.length > 0 && (
                  <ActivityIndicator size="small" color="#FFBE0B" style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAll} className="pb-1">
                <Text className="text-xs font-semibold text-[#FFBE0B]">Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadError && (
            <View className="mx-5 mb-4 flex-row items-center rounded-2xl border border-red-400/20 bg-red-950/30 p-4">
              <MaterialIcons name="error-outline" size={20} color="#F87171" />
              <Text className="ml-2 min-w-0 flex-1 text-xs leading-5 text-red-100">{loadError}</Text>
              <TouchableOpacity onPress={() => setRetryCount((count) => count + 1)} className="ml-2 rounded-full bg-[#2A2312] px-3 py-2">
                <Text className="text-xs font-bold text-[#FFBE0B]">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="mb-2 px-5 text-[10px] font-bold uppercase tracking-[1.8px] text-neutral-500">
            Featured
          </Text>
          {loading && barbers.length === 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[0, 1].map((item) => (
                <View key={item} className="mr-3 h-[250px] w-[285px] overflow-hidden rounded-[26px] border border-white/5 bg-[#1B1B1B]">
                  <View className="h-[145px] bg-white/[0.04]" />
                  <View className="p-4">
                    <View className="h-3 w-2/3 rounded-full bg-white/[0.08]" />
                    <View className="mt-3 h-2.5 w-1/2 rounded-full bg-white/[0.06]" />
                    <View className="mt-6 h-9 w-full rounded-full bg-white/[0.06]" />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : featuredBarbers.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {featuredBarbers.map((barber) => (
                <BarberProfileCard
                  key={`featured-${barber.id}`}
                  barber={barber}
                  onPress={() => router.push(`/barber/${barber.id}`)}
                  style={{ width: 285, marginRight: 12 }}
                  height={250}
                  showStartingPrice
                />
              ))}
            </ScrollView>
          ) : !loading && !loadError ? (
            <View className="mx-5 rounded-2xl border border-white/10 bg-[#181818] px-5 py-6">
              <MaterialIcons name="search-off" size={27} color="#FFBE0B" />
              <Text className="mt-3 text-base font-semibold text-white">No barbers found</Text>
              <Text className="mt-1 text-xs leading-5 text-neutral-400">
                Try a different service, location, or filter to discover more.
              </Text>
              <TouchableOpacity onPress={clearAll} className="mt-4 self-start rounded-full bg-[#FFBE0B] px-4 py-2.5">
                <Text className="text-xs font-bold text-[#2A2312]">Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View className="px-5">
          <View className="mb-3 flex-row items-end justify-between">
            <View>
              <Text className="text-lg font-PlayfairB text-white">All Barbers</Text>
              <Text className="mt-1 text-xs text-neutral-500">Browse every match</Text>
            </View>
            <TouchableOpacity onPress={openFilters} className="flex-row items-center pb-1">
              <MaterialIcons name="sort" size={16} color="#FFBE0B" />
              <Text className="ml-1.5 text-xs font-semibold text-[#FFBE0B]">Sort & filter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {sortOptions.map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                active={sortBy === option.key}
                onPress={() => setSortBy(option.key)}
              />
            ))}
          </ScrollView>

          {loading && barbers.length === 0 ? (
            <View className="items-center rounded-2xl border border-white/5 bg-[#181818] py-7">
              <ActivityIndicator color="#FFBE0B" />
              <Text className="mt-3 text-xs text-neutral-400">Finding your next great cut…</Text>
            </View>
          ) : sortedBarbers.length > 0 ? (
            <View className="gap-10">
              {sortedBarbers.map((barber) => (
                <BarberProfileCard
                  key={`all-${barber.id}`}
                  barber={barber}
                  onPress={() => router.push(`/barber/${barber.id}`)}
                  style={{ width: "100%" }}
                  height={230}
                  showStartingPrice
                />
              ))}
            </View>
          ) : !loadError ? (
            <View className="items-center rounded-2xl border border-white/10 bg-[#181818] px-6 py-8">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2A2312]">
                <MaterialIcons name="content-cut" size={25} color="#FFBE0B" />
              </View>
              <Text className="mt-4 text-base font-semibold text-white">Nothing here yet</Text>
              <Text className="mt-1 text-center text-xs leading-5 text-neutral-400">
                Relax your filters or try another search to see more barbers.
              </Text>
              <TouchableOpacity onPress={clearAll} className="mt-4 rounded-full bg-[#FFBE0B] px-4 py-2.5">
                <Text className="text-xs font-bold text-[#2A2312]">Clear all filters</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/65"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setFiltersVisible(false)}
            className="absolute inset-0"
            accessibilityLabel="Close filters"
          />
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 14), maxHeight: Dimensions.get("window").height * 0.88 }}
            className="rounded-t-[30px] border-t border-[#FFBE0B]/20 bg-[#151515] px-5 pt-3"
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">PERSONALIZE</Text>
                <Text className="mt-1 text-2xl font-PlayfairB text-white">Filters & sorting</Text>
              </View>
              <TouchableOpacity onPress={() => setFiltersVisible(false)} className="h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
                <MaterialIcons name="close" size={21} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              className="shrink"
            >
              <Text className="mb-2 text-xs font-semibold text-neutral-300">Location</Text>
              <View className="mb-5 flex-row items-center rounded-xl border border-white/10 bg-[#1D1D1D] px-3">
                <MaterialIcons name="place" size={18} color="#FFBE0B" />
                <TextInput
                  value={draftFilters.location}
                  onChangeText={(location) => setDraftFilters((current) => ({ ...current, location }))}
                  placeholder="City or neighborhood"
                  placeholderTextColor="#777"
                  className="h-12 flex-1 px-2 text-sm text-white"
                />
              </View>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Maximum distance</Text>
              <View className="mb-5 flex-row flex-wrap">
                {[null, 1, 3, 5, 10].map((distance) => (
                  <FilterChip
                    key={distance ?? "any"}
                    label={distance === null ? "Any" : `${distance} km`}
                    active={draftFilters.maxDistance === distance}
                    onPress={() => setDraftFilters((current) => ({ ...current, maxDistance: distance }))}
                  />
                ))}
              </View>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Minimum rating</Text>
              <View className="mb-5 flex-row flex-wrap">
                {[0, 3, 4, 4.5].map((rating) => (
                  <FilterChip
                    key={rating}
                    label={rating === 0 ? "Any rating" : `${rating}+`}
                    icon={rating > 0 ? "star" : undefined}
                    active={draftFilters.minRating === rating}
                    onPress={() => setDraftFilters((current) => ({ ...current, minRating: rating }))}
                  />
                ))}
              </View>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Service specialty</Text>
              <View className="mb-5 flex-row flex-wrap">
                {serviceNames.length > 0 ? serviceNames.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={draftFilters.selectedServices.includes(name)}
                    onPress={() => toggleDraftService(name)}
                  />
                )) : (
                  <Text className="text-xs text-neutral-500">Service options will appear when barber results load.</Text>
                )}
              </View>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Starting price (TND)</Text>
              <View className="mb-5 flex-row items-center">
                <TextInput
                  value={draftFilters.minPrice}
                  onChangeText={(minPrice) => setDraftFilters((current) => ({ ...current, minPrice }))}
                  keyboardType="decimal-pad"
                  placeholder="Min"
                  placeholderTextColor="#777"
                  className="h-12 flex-1 rounded-xl border border-white/10 bg-[#1D1D1D] px-3 text-sm text-white"
                  accessibilityLabel="Minimum starting price"
                />
                <Text className="mx-3 text-neutral-500">to</Text>
                <TextInput
                  value={draftFilters.maxPrice}
                  onChangeText={(maxPrice) => setDraftFilters((current) => ({ ...current, maxPrice }))}
                  keyboardType="decimal-pad"
                  placeholder="Max"
                  placeholderTextColor="#777"
                  className="h-12 flex-1 rounded-xl border border-white/10 bg-[#1D1D1D] px-3 text-sm text-white"
                  accessibilityLabel="Maximum starting price"
                />
              </View>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Available date & time</Text>
              <View className="mb-2 flex-row">
                <TextInput
                  value={draftFilters.availableDate}
                  onChangeText={(availableDate) => setDraftFilters((current) => ({ ...current, availableDate }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#777"
                  className="mr-2 h-12 flex-1 rounded-xl border border-white/10 bg-[#1D1D1D] px-3 text-sm text-white"
                  accessibilityLabel="Available date in year month day format"
                />
                <TextInput
                  value={draftFilters.availableTime}
                  onChangeText={(availableTime) => setDraftFilters((current) => ({ ...current, availableTime }))}
                  placeholder="HH:mm"
                  placeholderTextColor="#777"
                  className="h-12 w-[110px] rounded-xl border border-white/10 bg-[#1D1D1D] px-3 text-sm text-white"
                  accessibilityLabel="Available time in 24 hour format"
                />
              </View>
              <Text className="mb-5 text-[10px] leading-4 text-neutral-500">
                Live availability is checked against each barber’s schedule. Time checks reserve a 30-minute slot.
              </Text>

              <Text className="mb-2 text-xs font-semibold text-neutral-300">Sort results</Text>
              <View className="mb-5 flex-row flex-wrap">
                {sortOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    active={draftSortBy === option.key}
                    onPress={() => setDraftSortBy(option.key)}
                  />
                ))}
              </View>

              {dateValidationError ? (
                <Text className="mb-3 text-xs text-red-400">{dateValidationError}</Text>
              ) : null}
            </ScrollView>

            <View className="mt-3 flex-row border-t border-white/10 pt-4">
              <TouchableOpacity
                onPress={() => {
                  setDraftFilters(initialFilters);
                  setDraftSortBy("recommended");
                  setDateValidationError("");
                }}
                className="mr-3 h-[50px] flex-1 items-center justify-center rounded-2xl border border-white/15"
              >
                <Text className="text-sm font-bold text-neutral-300">Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyFilters}
                className="h-[50px] flex-[1.5] flex-row items-center justify-center rounded-2xl bg-[#FFBE0B]"
              >
                <Text className="mr-2 text-sm font-bold text-[#2A2312]">Apply filters</Text>
                <MaterialIcons name="arrow-forward" size={17} color="#2A2312" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
