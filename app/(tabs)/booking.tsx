import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api, type Booking } from '@/src/lib/api';
import { useAuth } from '@/src/auth/AuthContext';
import '../global.css';

interface BookingSummary {
  id: string;
  barber: string;
  services: string;
  date: string;
  time: string;
  price: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

const BookingTab = () => {
  const { user: authUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const [bookingResult, barberResult] = await Promise.all([
          api.getBookings(),
          api.getBarbers(),
        ]);

        setBookings(bookingResult.bookings);
        setBarberNames(
          Object.fromEntries(barberResult.barbers.map((barber) => [barber.id, barber.name]))
        );
      } catch (error) {
        console.error('Failed to load bookings', error);
        setBookings([]);
        setBarberNames({});
      }
    };

    loadBookings();
  }, [authUser?.id]);

  const bookingSummaries = useMemo<BookingSummary[]>(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      barber: barberNames[booking.barberId] ?? 'Barber',
      services: booking.serviceIds.length > 0 ? `${booking.serviceIds.length} service${booking.serviceIds.length === 1 ? '' : 's'}` : 'Service',
      date: booking.bookingDate,
      time: booking.startTime,
      price: `${booking.totalPrice} TND`,
      status: booking.status === 'cancelled' ? 'cancelled' : booking.status === 'completed' ? 'completed' : 'upcoming',
    }));
  }, [bookings, barberNames]);

  const upcomingBooking = bookingSummaries.find((booking) => booking.status === 'upcoming');

  const getStatusColor = (status: BookingSummary['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'upcoming':
        return '#FFD60A';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to cancel booking.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <Text className="text-white text-3xl font-PlayfairB mb-4">Bookings</Text>

      {upcomingBooking && (
        <View className="bg-[#FFD60A]/15 border border-[#FFD60A]/40 rounded-2xl p-4 mb-5">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="event-available" size={20} color="#FFD60A" />
            <Text className="text-[#FFD60A] font-bold ml-2">Next appointment</Text>
          </View>
          <Text className="text-white font-semibold text-lg">{upcomingBooking.barber}</Text>
          <Text className="text-neutral-300 mt-1">{upcomingBooking.services}</Text>
          <Text className="text-[#FFD60A] mt-2">
            {new Date(upcomingBooking.date).toLocaleDateString()} • {upcomingBooking.time}
          </Text>
        </View>
      )}

      <View className="space-y-3 pb-6">
        {bookingSummaries.length === 0 ? (
          <View className="items-center justify-center py-16">
            <MaterialIcons name="calendar-today" size={58} color="#6b7280" />
            <Text className="text-neutral-400 text-center mt-4 text-base">
              No bookings yet. Find a barber and schedule your next visit.
            </Text>
          </View>
        ) : (
          bookingSummaries.map((booking) => (
            <View key={booking.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">{booking.barber}</Text>
                  <Text className="text-neutral-400 mt-1">{booking.services}</Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${getStatusColor(booking.status)}20`,
                    borderColor: getStatusColor(booking.status),
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: getStatusColor(booking.status) }}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center">
                <MaterialIcons name="access-time" size={16} color="#FFD60A" />
                <Text className="text-neutral-300 ml-2">
                  {new Date(booking.date).toLocaleDateString()} • {booking.time}
                </Text>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[#FFD60A] font-bold text-lg">{booking.price}</Text>
                {booking.status === 'upcoming' && (
                  <TouchableOpacity
                    onPress={() => handleCancel(booking.id)}
                    className="bg-red-500/15 border border-red-500 rounded-xl px-3 py-2"
                  >
                    <Text className="text-red-400 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default BookingTab;
