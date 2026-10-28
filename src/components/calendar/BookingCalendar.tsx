import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BookingEvent from "./BookingEvent";
import {
  addDays,
  CalendarBooking,
  createBookingId,
  createSampleBookings,
  dateFromKey,
  dateKey,
  formatDateRange,
  formatTime,
  layoutOverlappingBookings,
  startOfWeek,
  timeToMinutes,
} from "./bookingCalendarUtils";

const INITIAL_NOW = new Date();
const DAY_COLUMN_WIDTH = 112;
const TIME_LABEL_WIDTH = 58;
const DEFAULT_WEEK_HEADER_HEIGHT = 72;
const MIN_HOUR_HEIGHT = 48;
const CLOSING_LABEL_HEIGHT = 24;
const COLOR_OPTIONS = ["#4285F4", "#34A853", "#A142F4", "#F9AB00", "#EA4335", "#12A594", "#E52592", "#5E6AD2"];

interface BookingCalendarProps {
  initialBookings?: CalendarBooking[];
  onBookingsChange?: (bookings: CalendarBooking[]) => void;
  openTime?: string;
  closeTime?: string;
}

interface BookingForm {
  id?: string;
  title: string;
  customer: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

const createEmptyForm = (date: string, openTime: string, closeTime: string): BookingForm => {
  const start = timeToMinutes(openTime) ?? 9 * 60;
  const close = timeToMinutes(closeTime) ?? 19 * 60;
  const end = Math.min(start + 30, close);
  const asTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return {
    title: "",
    customer: "",
    service: "",
    date,
    startTime: asTime(start),
    endTime: asTime(end),
    color: COLOR_OPTIONS[0],
  };
};

export default function BookingCalendar({
  initialBookings,
  onBookingsChange,
  openTime = "09:00",
  closeTime = "19:00",
}: BookingCalendarProps) {
  const [bookings, setBookings] = useState<CalendarBooking[]>(() => initialBookings ?? createSampleBookings(INITIAL_NOW, openTime, closeTime));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(INITIAL_NOW));
  const [now, setNow] = useState(INITIAL_NOW);
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [form, setForm] = useState<BookingForm | null>(null);
  const [calendarViewportHeight, setCalendarViewportHeight] = useState(0);
  const [weekHeaderHeight, setWeekHeaderHeight] = useState(DEFAULT_WEEK_HEADER_HEIGHT);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const selectedDateValue = useMemo(() => dateFromKey(selectedDate), [selectedDate]);
  const weekStart = useMemo(() => startOfWeek(selectedDateValue), [selectedDateValue]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const openMinutes = timeToMinutes(openTime) ?? 9 * 60;
  const closeMinutes = timeToMinutes(closeTime) ?? 19 * 60;
  const timelineDuration = Math.max(60, closeMinutes - openMinutes);
  const availableTimelineHeight = Math.max(0, calendarViewportHeight - weekHeaderHeight);
  const minimumTimelineHeight = (timelineDuration / 60) * MIN_HOUR_HEIGHT;
  const timelineHeight = Math.max(minimumTimelineHeight, availableTimelineHeight);
  const hourHeight = timelineHeight / (timelineDuration / 60);
  const hourOffsets = Array.from({ length: Math.ceil(timelineDuration / 60) }, (_, index) => index * 60);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return bookings.filter((booking) =>
      !query || [booking.title, booking.customer, booking.service].some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [bookings, search]);
  const bookingsByDate = useMemo(() => visibleBookings.reduce<Record<string, CalendarBooking[]>>((grouped, booking) => {
    (grouped[booking.date] ??= []).push(booking);
    return grouped;
  }, {}), [visibleBookings]);
  const dateRange = formatDateRange(weekDays[0], weekDays[6]);
  const nowKey = dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowVisible = nowMinutes >= openMinutes && nowMinutes <= closeMinutes;

  const updateBookings = (nextBookings: CalendarBooking[]) => {
    setBookings(nextBookings);
    onBookingsChange?.(nextBookings);
  };

  const goToToday = () => {
    setSelectedDate(dateKey(now));
  };

  const navigate = (direction: -1 | 1) => {
    const next = addDays(selectedDateValue, direction * 7);
    setSelectedDate(dateKey(next));
  };

  const openNewBooking = () => {
    setSelectedBooking(null);
    setForm(createEmptyForm(selectedDate, openTime, closeTime));
  };

  const openEditBooking = (booking: CalendarBooking) => {
    setSelectedBooking(null);
    setForm({ ...booking });
  };

  const saveBooking = () => {
    if (!form) return;
    const start = timeToMinutes(form.startTime);
    const end = timeToMinutes(form.endTime);
    const date = dateFromKey(form.date);
    if (!form.title.trim() || !form.customer.trim() || !form.service.trim()) {
      Alert.alert("Missing details", "Add a booking title, customer name, and service.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Number.isNaN(date.getTime()) || dateKey(date) !== form.date) {
      Alert.alert("Invalid date", "Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    if (start === null || end === null || end <= start || start < openMinutes || end > closeMinutes) {
      Alert.alert("Invalid time", `Enter a time between ${formatTime(openTime)} and ${formatTime(closeTime)}, with the end time after the start time.`);
      return;
    }

    const nextBooking: CalendarBooking = {
      id: form.id ?? createBookingId(),
      title: form.title.trim(),
      customer: form.customer.trim(),
      service: form.service.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
    };
    const nextBookings = form.id
      ? bookings.map((booking) => booking.id === form.id ? nextBooking : booking)
      : [...bookings, nextBooking];
    updateBookings(nextBookings);
    setSelectedDate(nextBooking.date);
    setForm(null);
  };

  const cancelBooking = (booking: CalendarBooking) => {
    Alert.alert("Cancel booking", `Cancel ${booking.title} for ${booking.customer}?`, [
      { text: "Keep booking", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: () => {
          updateBookings(bookings.filter((item) => item.id !== booking.id));
          setSelectedBooking(null);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-3 border-b border-neutral-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={goToToday} className="border border-neutral-700 rounded-lg px-3 py-2">
              <Text className="text-white font-semibold">Today</Text>
            </TouchableOpacity>
            <View className="flex-row ml-2">
              <TouchableOpacity onPress={() => navigate(-1)} accessibilityLabel="Previous date range" className="p-2">
                <Ionicons name="chevron-back" size={22} color="#d4d4d4" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigate(1)} accessibilityLabel="Next date range" className="p-2">
                <Ionicons name="chevron-forward" size={22} color="#d4d4d4" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={openNewBooking} accessibilityLabel="Create booking" className="bg-[#FFD60A] rounded-lg px-3 py-2 mr-2">
              <Ionicons name="add" size={20} color="#111111" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSearchVisible((visible) => !visible)} accessibilityLabel="Search bookings" className="p-2">
              <Ionicons name="search" size={20} color="#d4d4d4" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-neutral-500 text-xs mt-2">Open {formatTime(openTime)} · Close {formatTime(closeTime)}</Text>
        <Text className="text-white text-xl font-bold mt-3">{dateRange}</Text>
        {searchVisible ? (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search bookings, customers, services"
            placeholderTextColor="#737373"
            autoFocus
            className="text-white bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 mt-3"
            accessibilityLabel="Search bookings"
          />
        ) : null}
      </View>

      <View
        className="flex-1"
        onLayout={(event) => setCalendarViewportHeight(event.nativeEvent.layout.height)}
      >
        <ScrollView
          className="flex-1"
          nestedScrollEnabled
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator
        >
          <ScrollView horizontal style={{ flex: 1 }} showsHorizontalScrollIndicator>
            <View
              style={{
                width: TIME_LABEL_WIDTH + weekDays.length * DAY_COLUMN_WIDTH,
                minHeight: weekHeaderHeight + timelineHeight + CLOSING_LABEL_HEIGHT,
              }}
            >
              <View
                className="flex-row border-b border-neutral-800 bg-background"
                onLayout={(event) => setWeekHeaderHeight(event.nativeEvent.layout.height)}
              >
                <View style={{ width: TIME_LABEL_WIDTH }} />
                {weekDays.map((day) => {
                  const key = dateKey(day);
                  const isToday = key === nowKey;
                  const isSelected = key === selectedDate;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedDate(key)}
                      style={{
                        width: DAY_COLUMN_WIDTH,
                        backgroundColor: isSelected ? "rgba(255,190,11,0.06)" : "transparent",
                      }}
                      className="items-center py-3 border-l border-neutral-800"
                    >
                      <Text className={`text-xs font-semibold ${isSelected || isToday ? "text-[#FFD60A]" : "text-neutral-400"}`}>
                        {day.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
                      </Text>
                      {isToday ? (
                        <View className="mt-1 rounded-full bg-[#FFBE0B]/15 px-1.5 py-0.5">
                          <Text className="text-[#FFD60A] text-[8px] font-bold tracking-wider">TODAY</Text>
                        </View>
                      ) : null}
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center mt-1 ${
                          isSelected ? "bg-[#FFBE0B]" : isToday ? "border border-[#FFBE0B]" : ""
                        }`}
                      >
                        <Text className={`text-lg ${isSelected ? "text-[#FFD60A] font-bold" : isToday ? "text-[#FFD60A] font-semibold" : "text-white"}`}>
                          {day.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View className="flex-row">
                <View style={{ width: TIME_LABEL_WIDTH, height: timelineHeight }}>
                  {hourOffsets.map((offset) => {
                    const hourTime = openMinutes + offset;
                    const label = formatTime(`${String(Math.floor(hourTime / 60)).padStart(2, "0")}:${String(hourTime % 60).padStart(2, "0")}`);
                    return (
                      <View key={offset} style={{ height: Math.min(60, timelineDuration - offset) / 60 * hourHeight }} className="items-end pr-2">
                        <Text className="text-white text-[11px] font-semibold" style={{ marginTop: -7 }}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
                <View className="flex-row">
                  {weekDays.map((day) => {
                    const key = dateKey(day);
                    const dayBookings = bookingsByDate[key] ?? [];
                    const positioned = layoutOverlappingBookings(dayBookings);
                    return (
                      <View
                        key={key}
                        style={{
                          width: DAY_COLUMN_WIDTH,
                          height: timelineHeight,
                          backgroundColor: key === selectedDate ? "#302C20" : "#292929",
                        }}
                        className="border-l border-neutral-700"
                      >
                        {hourOffsets.map((offset) => (
                          <View
                            key={offset}
                            style={{ height: Math.min(60, timelineDuration - offset) / 60 * hourHeight }}
                            className="border-t border-neutral-700"
                          />
                        ))}
                        {positioned.map(({ booking, lane, laneCount }) => {
                          const start = timeToMinutes(booking.startTime);
                          const end = timeToMinutes(booking.endTime);
                          if (start === null || end === null) return null;
                          const visibleStart = Math.max(start, openMinutes);
                          const visibleEnd = Math.min(end, closeMinutes);
                          if (visibleEnd <= visibleStart) return null;
                          const top = ((visibleStart - openMinutes) / 60) * hourHeight;
                          const height = Math.max(24, ((visibleEnd - visibleStart) / 60) * hourHeight);
                          const width = `${100 / laneCount}%` as `${number}%`;
                          const left = `${(lane * 100) / laneCount}%` as `${number}%`;
                          return (
                            <View key={booking.id} className="absolute px-0.5" style={{ top, height, left, width, zIndex: 2 }}>
                              <BookingEvent booking={booking} compact={height < 58 || laneCount > 1} onPress={() => setSelectedBooking(booking)} />
                            </View>
                          );
                        })}
                        {nowVisible && key === nowKey ? (
                          <View pointerEvents="none" className="absolute left-0 right-0 flex-row items-center" style={{ top: ((nowMinutes - openMinutes) / 60) * hourHeight, zIndex: 5 }}>
                            <View className="w-2 h-2 rounded-full bg-[#EA4335]" />
                            <View className="flex-1 h-[2px] bg-[#EA4335]" />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
              <View className="flex-row">
                <View
                  style={{ width: TIME_LABEL_WIDTH, height: CLOSING_LABEL_HEIGHT }}
                  className="items-end pr-2 justify-center"
                >
                  <Text className="text-white text-[11px] font-semibold">
                    {formatTime(closeTime)}
                  </Text>
                </View>
                <View
                  style={{ width: weekDays.length * DAY_COLUMN_WIDTH, height: CLOSING_LABEL_HEIGHT }}
                  className="border-t border-neutral-700 bg-[#292929]"
                />
              </View>
              {visibleBookings.length === 0 ? <Text className="text-neutral-500 text-center mt-5">No bookings match your search.</Text> : null}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      <Modal visible={selectedBooking !== null} transparent animationType="fade" onRequestClose={() => setSelectedBooking(null)}>
        <Pressable onPress={() => setSelectedBooking(null)} className="flex-1 bg-black/70 justify-center px-5">
          {selectedBooking ? (
            <Pressable onPress={(event) => event.stopPropagation()} className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-xl font-bold">{selectedBooking.title}</Text>
                  <Text className="text-neutral-400 mt-1">{selectedBooking.service}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBooking(null)} accessibilityLabel="Close booking details" className="p-1">
                  <Ionicons name="close" size={22} color="#a3a3a3" />
                </TouchableOpacity>
              </View>
              <View className="h-1 rounded-full mt-4" style={{ backgroundColor: selectedBooking.color }} />
              <Text className="text-white mt-4">{selectedBooking.customer}</Text>
              <Text className="text-neutral-300 mt-2">{dateFromKey(selectedBooking.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</Text>
              <Text className="text-neutral-300 mt-1">{formatTime(selectedBooking.startTime)} – {formatTime(selectedBooking.endTime)}</Text>
              <View className="flex-row mt-6 items-center justify-center ">
                <TouchableOpacity
                  onPress={() => openEditBooking(selectedBooking)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit or reschedule booking"
                  activeOpacity={0.86}
                  className="flex-1 mr-2"
                >
                  <LinearGradient
                    colors={["#33465D", "#202B39"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      minHeight: 52,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#53677F",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 10,
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#C9D8E8" />
                    <Text className="text-slate-100 text-center font-bold ml-2">Edit / reschedule</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => cancelBooking(selectedBooking)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel booking"
                  activeOpacity={0.86}
                  className="ml-1"
                >
                  <LinearGradient
                    colors={["#5A3036", "#382126"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      minHeight: 52,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#75434A",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 14,
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#F1B5B8" />
                    <Text className="text-red-100 font-bold ml-2">Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>

      <Modal visible={form !== null} transparent animationType="slide" onRequestClose={() => setForm(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-neutral-900 border-t border-neutral-700 rounded-t-3xl px-5 pt-5 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">{form?.id ? "Edit booking" : "New booking"}</Text>
              <TouchableOpacity onPress={() => setForm(null)} accessibilityLabel="Close booking form" className="p-1">
                <Ionicons name="close" size={22} color="#a3a3a3" />
              </TouchableOpacity>
            </View>
            {form ? (
              <ScrollView keyboardShouldPersistTaps="handled">
                {([
                  ["title", "Booking title", "Skin fade"],
                  ["customer", "Customer name", "Customer name"],
                  ["service", "Service", "Haircut and styling"],
                  ["date", "Date (YYYY-MM-DD)", "YYYY-MM-DD"],
                  ["startTime", "Start time (24-hour)", "09:00"],
                  ["endTime", "End time (24-hour)", "10:00"],
                ] as const).map(([field, label, placeholder]) => (
                  <View key={field} className="mb-3">
                    <Text className="text-neutral-400 text-xs mb-1">{label}</Text>
                    <TextInput
                      value={form[field]}
                      onChangeText={(value) => setForm((current) => current ? { ...current, [field]: value } : current)}
                      placeholder={placeholder}
                      placeholderTextColor="#737373"
                      autoCapitalize={field === "date" || field === "startTime" || field === "endTime" ? "none" : "words"}
                      className="text-white bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3"
                    />
                  </View>
                ))}
                <Text className="text-neutral-400 text-xs mb-2">Event color</Text>
                <View className="flex-row mb-5">
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setForm((current) => current ? { ...current, color } : current)}
                      accessibilityRole="button"
                      accessibilityLabel={`Choose event color ${color}`}
                      accessibilityState={{ selected: form.color === color }}
                      className={`w-8 h-8 rounded-full mr-2 items-center justify-center ${form.color === color ? "border-2 border-white" : ""}`}
                      style={{ backgroundColor: color }}
                    >
                      {form.color === color ? <Ionicons name="checkmark" size={17} color="white" /> : null}
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={saveBooking}
                  accessibilityRole="button"
                  accessibilityLabel={form.id ? "Save booking changes" : "Create booking"}
                  activeOpacity={0.86}
                  className="mb-2"
                >
                  <LinearGradient
                    colors={["#F3D28A", "#D5A744"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      minHeight: 54,
                      borderRadius: 15,
                      borderWidth: 1,
                      borderColor: "#F8E3B2",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={form.id ? "checkmark-circle-outline" : "add-circle-outline"} size={20} color="#30230C" />
                    <Text className="text-[#30230C] text-center font-bold ml-2">
                      {form.id ? "Save changes" : "Create booking"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
