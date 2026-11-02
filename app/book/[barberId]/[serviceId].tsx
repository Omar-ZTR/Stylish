import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type Barber, type Booking as BookingRecord } from "@/src/lib/api";
import { isOpenOnDate } from "@/src/lib/barberSchedule";
import "../../global.css";

type RouteParams = {
  barberId?: string | string[];
  serviceId?: string | string[];
  services?: string | string[];
};

type BarberLoadState = {
  id: string | null;
  status: "loading" | "ready" | "error";
  barber?: Barber;
  error?: string;
};

type Availability = {
  date: string;
  isOpen: boolean;
  booked: Pick<BookingRecord, "startTime" | "endTime">[];
  openingHours: {
    start: string;
    end: string;
    pauseStart?: string;
    pauseEnd?: string;
  };
};

type AvailabilityState = {
  key: string;
  status: "loading" | "ready" | "error";
  data?: Availability;
  error?: string;
};

type TimeSlot = {
  time: string;
  available: boolean;
};

const ACCENT = "#FFBE0B";
const SLOT_INTERVAL_MINUTES = 30;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatPrice(price: number) {
  return `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

function createDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    return dateKey(date);
  });
}

function createSlots(
  date: string,
  availability: Availability,
  durationMinutes: number,
): TimeSlot[] {
  if (!availability.isOpen) return [];

  const opening = timeToMinutes(availability.openingHours.start);
  const closing = timeToMinutes(availability.openingHours.end);
  if (!Number.isFinite(opening) || !Number.isFinite(closing) || closing <= opening) return [];

  const firstSlot = Math.ceil(opening / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
  const now = new Date();
  const todayKey = dateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const bookedIntervals = availability.booked.map((booking) => ({
    start: timeToMinutes(booking.startTime),
    end: timeToMinutes(booking.endTime),
  }));
  const pauseStart = availability.openingHours.pauseStart
    ? timeToMinutes(availability.openingHours.pauseStart)
    : null;
  const pauseEnd = availability.openingHours.pauseEnd
    ? timeToMinutes(availability.openingHours.pauseEnd)
    : null;

  const slots: TimeSlot[] = [];
  for (let start = firstSlot; start < closing; start += SLOT_INTERVAL_MINUTES) {
    const end = start + durationMinutes;
    const isPast = date < todayKey || (date === todayKey && start <= currentMinutes);
    const outsideHours = start < opening || end > closing;
    const overlapsBreak = pauseStart !== null && pauseEnd !== null
      && start < pauseEnd && end > pauseStart;
    const overlapsBooking = bookedIntervals.some(
      (booking) => start < booking.end && end > booking.start,
    );

    slots.push({
      time: minutesToTime(start),
      available: !isPast && !outsideHours && !overlapsBreak && !overlapsBooking,
    });
  }
  return slots;
}

export default function Booking() {
  const params = useLocalSearchParams<RouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barberId = getParam(params.barberId);
  const serviceId = getParam(params.serviceId);
  const servicesParam = getParam(params.services);
  const routeServiceIds = useMemo(() => {
    const ids = servicesParam?.split(",").filter(Boolean) ?? [];
    if (!ids.length && serviceId) ids.push(serviceId);
    return [...new Set(ids)];
  }, [serviceId, servicesParam]);
  const [barberState, setBarberState] = useState<BarberLoadState>({
    id: null,
    status: "loading",
  });
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>({
    key: "",
    status: "loading",
  });
  const [timeSelection, setTimeSelection] = useState<{ key: string; time: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [entrance] = useState(() => new Animated.Value(0));
  const [buttonScale] = useState(() => new Animated.Value(1));
  const submittingRef = useRef(false);

  const dates = useMemo(() => createDates(), []);
  const barber = barberState.id === barberId && barberState.status === "ready"
    ? barberState.barber ?? null
    : null;
  const barberLoading = Boolean(barberId)
    && (barberState.id !== barberId || barberState.status === "loading");
  const barberError = barberId
    ? barberState.id === barberId && barberState.status === "error"
      ? barberState.error
      : null
    : "A barber was not selected.";
  const services = useMemo(() => {
    if (!barber) return [];
    return routeServiceIds
      .map((id) => barber.services.find((service) => service.id === id))
      .filter((service) => service !== undefined);
  }, [barber, routeServiceIds]);
  const totalPrice = services.reduce((total, service) => total + service.price, 0);
  const totalDuration = services.reduce((total, service) => total + service.durationMinutes, 0);
  const dateIsOpen = barber ? isOpenOnDate(barber.operatingDays, selectedDate) : false;
  const availabilityKey = `${barberId ?? ""}:${selectedDate}:${availabilityRetry}`;
  const availability = availabilityState.key === availabilityKey
    && availabilityState.status === "ready"
    ? availabilityState.data ?? null
    : null;
  const availabilityLoading = Boolean(barber && selectedDate && dateIsOpen)
    && (availabilityState.key !== availabilityKey || availabilityState.status === "loading");
  const availabilityError = availabilityState.key === availabilityKey
    && availabilityState.status === "error"
    ? availabilityState.error
    : null;
  const slots = useMemo(
    () => availability && totalDuration > 0
      ? createSlots(selectedDate, availability, totalDuration)
      : [],
    [availability, selectedDate, totalDuration],
  );
  const selectedTime = timeSelection?.key === availabilityKey
    ? timeSelection.time
    : slots.find((slot) => slot.available)?.time ?? null;
  const selectedSlotAvailable = selectedTime !== null
    && slots.some((slot) => slot.time === selectedTime && slot.available);
  const serviceListWidth = Math.max(0, width - 40);

  useEffect(() => {
    let active = true;
    if (!barberId) return () => { active = false; };

    api.getBarber(barberId)
      .then(({ barber: result }) => {
        if (active) setBarberState({ id: barberId, status: "ready", barber: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBarberState({
          id: barberId,
          status: "error",
          error: error instanceof Error ? error.message : "Could not load this barber.",
        });
      });

    return () => {
      active = false;
    };
  }, [barberId]);

  useEffect(() => {
    if (!barber || !dateIsOpen) return;
    let active = true;
    api.getAvailability(barber.id, selectedDate)
      .then((result) => {
        if (active) setAvailabilityState({ key: availabilityKey, status: "ready", data: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAvailabilityState({
          key: availabilityKey,
          status: "error",
          error: error instanceof Error ? error.message : "Could not load appointment availability.",
        });
      });

    return () => {
      active = false;
    };
  }, [availabilityKey, barber, dateIsOpen, selectedDate]);

  useEffect(() => {
    if (!barber) return;
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [barber, entrance]);

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      speed: 26,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const confirmBooking = async () => {
    if (
      !barber
      || !services.length
      || !selectedTime
      || !selectedSlotAvailable
      || submittingRef.current
    ) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { booking } = await api.createBooking({
        barberId: barber.id,
        serviceIds: services.map((service) => service.id),
        bookingDate: selectedDate,
        startTime: selectedTime,
      });
      Alert.alert(
        booking.status === "confirmed" ? "Booking confirmed" : "Booking request sent",
        booking.status === "confirmed"
          ? `Your appointment with ${barber.name} is confirmed for ${selectedDate} at ${selectedTime}.`
          : `Your appointment request with ${barber.name} is sent for ${selectedDate} at ${selectedTime}.`,
        [{ text: "Done", onPress: () => router.replace("/(tabs)/profile") }],
      );
    } catch (error) {
      Alert.alert(
        "Booking unavailable",
        error instanceof Error ? error.message : "Please choose another available time.",
      );
      setAvailabilityRetry((count) => count + 1);
      setTimeSelection(null);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (barberLoading || (!barber && !barberError)) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111]">
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-4 text-sm text-neutral-300">Loading your booking…</Text>
      </View>
    );
  }

  if (!barber) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <MaterialIcons name="content-cut" size={40} color={ACCENT} />
        <Text className="mt-4 text-center text-lg font-PlayfairB text-white">Booking unavailable</Text>
        <Text className="mt-2 text-center text-sm text-neutral-400">
          {barberError ?? "Could not load this barber."}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 rounded-full bg-[#FFBE0B] px-6 py-3">
          <Text className="font-bold text-[#17130A]">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!services.length || services.length !== routeServiceIds.length) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <MaterialIcons name="content-cut" size={40} color={ACCENT} />
        <Text className="mt-4 text-center text-lg font-PlayfairB text-white">Service unavailable</Text>
        <Text className="mt-2 text-center text-sm text-neutral-400">
          One or more selected services are no longer available. Return to the barber profile and choose again.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 rounded-full bg-[#FFBE0B] px-6 py-3">
          <Text className="font-bold text-[#17130A]">Back to barber</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#111111]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: 188 + insets.bottom,
        }}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}
        >
          <View className="mb-5 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#1B1B1A]"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={21} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">Stylish booking</Text>
              <Text className="mt-0.5 text-xl font-PlayfairB text-white">Reserve your chair</Text>
            </View>
          </View>

          <View className="mb-5 overflow-hidden rounded-3xl border border-[#FFBE0B]/25 bg-[#2A2312]">
            <LinearGradient
              colors={["rgba(255,190,11,0.12)", "rgba(42,35,18,0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex-row items-center p-4">
              <Image
                source={{ uri: barber.logoUrl }}
                className="h-[66px] w-[66px] rounded-2xl"
                resizeMode="cover"
              />
              <View className="ml-3 min-w-0 flex-1">
                <Text className="text-lg font-PlayfairB text-white" numberOfLines={1}>{barber.name}</Text>
                <View className="mt-1 flex-row items-center">
                  <MaterialIcons name="star" size={15} color={ACCENT} />
                  <Text className="ml-1 text-xs font-bold text-white">{barber.rating.toFixed(1)}</Text>
                  <View className="mx-2 h-1 w-1 rounded-full bg-neutral-500" />
                  <MaterialIcons name="place" size={14} color={ACCENT} />
                  <Text className="ml-1 min-w-0 flex-1 text-xs text-neutral-300" numberOfLines={1}>
                    {barber.location}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="verified" size={20} color={ACCENT} />
            </View>
          </View>

          <View className="mb-5 rounded-3xl border border-white/10 bg-[#191A1A] p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-PlayfairB text-white">Your services</Text>
              <Text className="text-xs text-neutral-400">
                {services.length} {services.length === 1 ? "service" : "services"} selected
              </Text>
            </View>
            {services.map((service, index) => (
              <View
                key={service.id}
                className={`flex-row items-center justify-between py-3 ${
                  index < services.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <View className="mr-3 min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-white" numberOfLines={1}>{service.name}</Text>
                  <Text className="mt-1 text-xs text-neutral-400">{service.durationMinutes} min</Text>
                </View>
                <Text className="text-sm font-bold text-[#FFBE0B]">{formatPrice(service.price)}</Text>
              </View>
            ))}
            <View className="mt-2 flex-row items-center justify-between border-t border-[#FFBE0B]/25 pt-3">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-neutral-400">Total</Text>
                <Text className="mt-1 text-xs text-neutral-300">{formatDuration(totalDuration)} service time</Text>
              </View>
              <Text className="text-xl font-PlayfairB text-[#FFBE0B]">{formatPrice(totalPrice)}</Text>
            </View>
          </View>

          <View className="mb-5">
            <View className="mb-3 flex-row items-end justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFBE0B]">Your visit</Text>
                <Text className="mt-1 text-xl font-PlayfairB text-white">Choose a date</Text>
              </View>
              <Text className="pb-1 text-xs text-neutral-400">Next 7 days</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
              {dates.map((date) => {
                const dateObject = dateFromKey(date);
                const selected = date === selectedDate;
                const open = isOpenOnDate(barber.operatingDays, date);
                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => {
                      setSelectedDate(date);
                      setTimeSelection(null);
                    }}
                    disabled={!open}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: !open }}
                    accessibilityLabel={`${dateObject.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${open ? "" : ", closed"}`}
                    className={`w-[61px] items-center rounded-2xl border py-3 ${
                      selected
                        ? "border-[#FFBE0B] bg-[#FFBE0B]"
                        : open
                          ? "border-white/10 bg-[#1B1B1A]"
                          : "border-white/5 bg-[#171717] opacity-40"
                    }`}
                  >
                    <Text className={`text-[10px] font-bold uppercase ${selected ? "text-[#17130A]/70" : "text-neutral-400"}`}>
                      {dateObject.toLocaleDateString(undefined, { weekday: "short" })}
                    </Text>
                    <Text className={`mt-1 text-xl font-PlayfairB ${selected ? "text-[#17130A]" : "text-white"}`}>
                      {dateObject.getDate()}
                    </Text>
                    <Text className={`mt-0.5 text-[10px] ${selected ? "text-[#17130A]/70" : "text-neutral-500"}`}>
                      {dateObject.toLocaleDateString(undefined, { month: "short" })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="mb-5">
            <View className="mb-3 flex-row items-end justify-between">
              <View>
                <Text className="text-xl font-PlayfairB text-white">Available times</Text>
                <Text className="mt-1 text-xs text-neutral-400">
                  {dateFromKey(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </Text>
              </View>
              {selectedTime && selectedSlotAvailable && (
                <View className="flex-row items-center pb-1">
                  <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#FFBE0B]" />
                  <Text className="text-xs font-semibold text-[#FFBE0B]">{selectedTime} selected</Text>
                </View>
              )}
            </View>

            {availabilityLoading ? (
              <View className="items-center rounded-2xl border border-white/10 bg-[#191A1A] py-8">
                <ActivityIndicator color={ACCENT} />
                <Text className="mt-3 text-xs text-neutral-400">Checking live availability…</Text>
              </View>
            ) : availabilityError ? (
              <View className="items-center rounded-2xl border border-red-500/25 bg-[#191A1A] px-5 py-6">
                <MaterialIcons name="cloud-off" size={24} color="#F87171" />
                <Text className="mt-2 text-center text-sm font-semibold text-white">Availability unavailable</Text>
                <Text className="mt-1 text-center text-xs text-neutral-400">{availabilityError}</Text>
                <TouchableOpacity
                  onPress={() => setAvailabilityRetry((count) => count + 1)}
                  className="mt-4 rounded-full border border-[#FFBE0B]/50 px-4 py-2"
                >
                  <Text className="text-xs font-bold text-[#FFBE0B]">Try again</Text>
                </TouchableOpacity>
              </View>
            ) : !dateIsOpen || (availability && !availability.isOpen) ? (
              <View className="rounded-2xl border border-white/10 bg-[#191A1A] px-5 py-7">
                <Text className="text-center text-sm text-neutral-400">This barber is closed on this date.</Text>
              </View>
            ) : availability ? (
              slots.length ? (
                <>
                  <View className="mb-3 flex-row items-center">
                    <View className="mr-2 h-2 w-2 rounded-full bg-[#FFBE0B]" />
                    <Text className="text-[11px] text-neutral-400">Available</Text>
                    <View className="ml-4 mr-2 h-2 w-2 rounded-full bg-neutral-700" />
                    <Text className="text-[11px] text-neutral-400">Unavailable</Text>
                  </View>
                  <View className="flex-row flex-wrap" style={{ gap: 9 }}>
                    {slots.map((slot) => {
                      const selected = selectedTime === slot.time && slot.available;
                      return (
                        <TouchableOpacity
                          key={slot.time}
                          onPress={() => setTimeSelection({ key: availabilityKey, time: slot.time })}
                          disabled={!slot.available}
                          accessibilityRole="radio"
                          accessibilityState={{ selected, disabled: !slot.available }}
                          accessibilityLabel={`${slot.time}${slot.available ? " available" : " unavailable"}`}
                          style={{ width: (serviceListWidth - 18) / 3 }}
                          className={`items-center rounded-xl border py-3 ${
                            selected
                              ? "border-[#FFBE0B] bg-[#FFBE0B]"
                              : slot.available
                                ? "border-white/10 bg-[#1B1B1A]"
                                : "border-white/5 bg-[#171717] opacity-40"
                          }`}
                        >
                          <Text className={`text-sm font-bold ${selected ? "text-[#17130A]" : slot.available ? "text-white" : "text-neutral-500"}`}>
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {!slots.some((slot) => slot.available) && (
                    <Text className="mt-3 text-center text-xs text-neutral-400">
                      No available times remain for this date.
                    </Text>
                  )}
                </>
              ) : (
                <View className="rounded-2xl border border-white/10 bg-[#191A1A] px-5 py-7">
                  <Text className="text-center text-sm text-neutral-400">
                    No appointment times fit these services during the barber’s opening hours.
                  </Text>
                </View>
              )
            ) : (
              <View className="rounded-2xl border border-white/10 bg-[#191A1A] px-5 py-6">
                <Text className="text-center text-sm text-neutral-400">
                  Select an open day to check available appointments.
                </Text>
              </View>
            )}
          </View>

          <View className="rounded-2xl border border-[#FFBE0B]/20 bg-[#2A2312]/70 p-4">
            <View className="mb-3 flex-row items-center">
              <MaterialIcons name="receipt-long" size={18} color={ACCENT} />
              <Text className="ml-2 text-sm font-PlayfairB text-white">Booking summary</Text>
            </View>
            <SummaryRow icon="person-outline" label="Barber" value={barber.name} />
            <SummaryRow
              icon="content-cut"
              label="Services"
              value={services.map((service) => service.name).join(", ")}
            />
            <SummaryRow
              icon="calendar-today"
              label="Date"
              value={dateFromKey(selectedDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            />
            <SummaryRow icon="schedule" label="Time" value={selectedTime ?? "Choose a time"} />
            <View className="mt-3 flex-row items-center justify-between border-t border-white/10 pt-3">
              <Text className="text-sm font-semibold text-neutral-200">Total · {formatDuration(totalDuration)}</Text>
              <Text className="text-lg font-PlayfairB text-[#FFBE0B]">{formatPrice(totalPrice)}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#111111]/95 px-5 pt-3"
      >
        <View className="flex-row items-center">
          <View className="mr-4 min-w-0 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400">
              {selectedTime && selectedSlotAvailable ? `Appointment · ${selectedTime}` : "Choose an available time"}
            </Text>
            <Text className="mt-1 text-lg font-PlayfairB text-[#FFBE0B]">{formatPrice(totalPrice)}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={() => void confirmBooking()}
              onPressIn={() => animateButton(0.975)}
              onPressOut={() => animateButton(1)}
              disabled={
                submitting
                || !selectedSlotAvailable
                || availabilityLoading
                || Boolean(availabilityError)
                || !availability
              }
              accessibilityRole="button"
              accessibilityLabel={submitting ? "Confirming booking" : "Confirm appointment"}
              className={`min-w-[170px] flex-row items-center justify-center rounded-full px-5 py-4 ${
                selectedSlotAvailable && availability && !availabilityError && !submitting
                  ? "bg-[#FFBE0B]"
                  : "bg-neutral-700"
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#17130A" />
              ) : (
                <>
                  <Text className="mr-2 text-sm font-bold text-[#17130A]">Confirm booking</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#17130A" />
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="mt-2 flex-row items-center">
      <MaterialIcons name={icon} size={15} color="#FFBE0B" />
      <Text className="ml-2 w-[62px] text-xs text-neutral-400">{label}</Text>
      <Text className="min-w-0 flex-1 text-right text-xs font-medium text-neutral-200" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
