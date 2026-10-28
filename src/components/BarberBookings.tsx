import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import BookingCalendar from "@/src/components/calendar/BookingCalendar";
import { api, type Booking } from "@/src/lib/api";

type ActiveSection = "calendar" | "requests";

export default function BarberBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("calendar");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [bookingResult, barberResult] = await Promise.all([api.getMyBookings(), api.getMyBarber()]);
      setBookings(bookingResult.bookings);
      setAutoAccept(Boolean(barberResult.barber.autoAcceptBookings));
      setOpenTime(barberResult.barber.startTime);
      setCloseTime(barberResult.barber.endTime);
    } catch (error) {
      Alert.alert("Could not load bookings", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setRefreshing(false);
      setScheduleLoaded(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleAutoAccept = async () => {
    try {
      const barber = await api.getMyBarber();
      const result = await api.updateMyBarber({
        name: barber.barber.name,
        location: barber.barber.location,
        startTime: barber.barber.startTime,
        endTime: barber.barber.endTime,
        pauseStartTime: barber.barber.pauseStartTime,
        pauseEndTime: barber.barber.pauseEndTime,
        autoAcceptBookings: !autoAccept,
      });
      setAutoAccept(Boolean(result.barber.autoAcceptBookings));
    } catch (error) {
      Alert.alert("Could not update booking setting", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const respond = async (booking: Booking, status: "confirmed" | "cancelled") => {
    try {
      const result = await api.updateMyBooking(booking.id, status);
      setBookings((current) => current.map((item) => item.id === booking.id ? result.booking : item));
    } catch (error) {
      Alert.alert("Could not update booking", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const renderBooking = (booking: Booking) => {
    const pending = booking.status === "pending";
    const statusClass = booking.status === "confirmed"
      ? "text-green-400"
      : booking.status === "cancelled"
        ? "text-red-400"
        : booking.status === "completed"
          ? "text-neutral-400"
          : "text-[#FFD60A]";

    return (
      <View key={booking.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-3">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-white font-bold">{new Date(`${booking.bookingDate}T12:00:00`).toLocaleDateString()}</Text>
            <Text className="text-neutral-400 mt-1">{booking.startTime} - {booking.endTime}</Text>
          </View>
          <Text className={`font-bold ${statusClass}`}>{booking.status}</Text>
        </View>
        <View className="border-t border-neutral-800 mt-3 pt-3">
          <Text className="text-neutral-300">{booking.serviceIds.length} service{booking.serviceIds.length === 1 ? "" : "s"}</Text>
          <Text className="text-[#FFD60A] font-bold mt-1">{booking.totalPrice} TND</Text>
        </View>
        {pending ? (
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity onPress={() => void respond(booking, "cancelled")} className="flex-1 border border-red-500/60 rounded-xl py-3">
              <Text className="text-red-400 text-center font-bold">Refuse</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void respond(booking, "confirmed")} className="flex-1 bg-[#FFD60A] rounded-xl py-3">
              <Text className="text-black text-center font-bold">Accept</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row px-4 pt-3 pb-2 border-b border-neutral-800">
        {(["calendar", "requests"] as const).map((section) => (
          <TouchableOpacity
            key={section}
            onPress={() => setActiveSection(section)}
            accessibilityRole="button"
            accessibilityState={{ selected: activeSection === section }}
            className={`flex-1 flex-row items-center justify-center rounded-lg py-2 ${activeSection === section ? "bg-neutral-800" : ""}`}
          >
            <Ionicons name={section === "calendar" ? "calendar-outline" : "list-outline"} size={17} color={activeSection === section ? "#8AB4F8" : "#a3a3a3"} />
            <Text className={`font-semibold ml-2 capitalize ${activeSection === section ? "text-white" : "text-neutral-400"}`}>{section}</Text>
            {section === "requests" && bookings.length > 0 ? (
              <Text className="text-[#8AB4F8] text-xs font-bold ml-1">({bookings.length})</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <View
        className={activeSection === "calendar" ? "flex-1 mb-5 pb-5" : ""}
        pointerEvents={activeSection === "calendar" ? "auto" : "none"}
        style={activeSection === "calendar"
          ? undefined
          : { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0 }}
      >
        {scheduleLoaded
          ? <BookingCalendar openTime={openTime} closeTime={closeTime} />
          : <View className="flex-1 items-center justify-center"><Text className="text-neutral-400">Loading barber schedule...</Text></View>}
      </View>
      {activeSection === "requests" ? (
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-white text-3xl font-PlayfairB">Booking requests</Text>
              <Text className="text-neutral-400 mt-1">Manage live client requests.</Text>
            </View>
            <View className="bg-[#FFD60A]/15 rounded-xl p-3"><Ionicons name="calendar" size={24} color="#FFD60A" /></View>
          </View>
          <TouchableOpacity onPress={() => void toggleAutoAccept()} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold">Accept bookings automatically</Text>
              <Text className="text-neutral-400 text-xs mt-1">New requests are confirmed instantly.</Text>
            </View>
            <View className={`w-12 h-7 rounded-full justify-center px-1 ${autoAccept ? "bg-[#FFD60A] items-end" : "bg-neutral-700 items-start"}`}><View className="w-5 h-5 rounded-full bg-white" /></View>
          </TouchableOpacity>
          {bookings.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="calendar-outline" size={54} color="#6b7280" />
              <Text className="text-white font-bold text-lg mt-4">No live booking requests</Text>
              <Text className="text-neutral-400 text-center mt-2">Pull down to refresh your requests.</Text>
            </View>
          ) : bookings.map(renderBooking)}
        </ScrollView>
      ) : null}
    </View>
  );
}
