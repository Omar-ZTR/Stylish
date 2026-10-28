import { Text, TouchableOpacity, View } from "react-native";
import type { CalendarBooking } from "./bookingCalendarUtils";
import { formatTime } from "./bookingCalendarUtils";

export default function BookingEvent({
  booking,
  compact = false,
  onPress,
}: {
  booking: CalendarBooking;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${booking.title}, ${booking.customer}, ${formatTime(booking.startTime)} to ${formatTime(booking.endTime)}`}
      className="flex-1 overflow-hidden rounded-md px-1.5 py-1"
      style={{ backgroundColor: `${booking.color}26`, borderLeftWidth: 3, borderLeftColor: booking.color }}
    >
      <Text className="text-white font-bold" numberOfLines={1} style={{ fontSize: compact ? 10 : 12 }}>
        {booking.title}
      </Text>
      <Text className="text-neutral-200" numberOfLines={1} style={{ fontSize: compact ? 9 : 11 }}>
        {booking.customer}
      </Text>
      {!compact ? (
        <View className="mt-1">
          <Text className="text-neutral-300" numberOfLines={1} style={{ fontSize: 10 }}>
            {booking.service}
          </Text>
          <Text className="text-neutral-300" numberOfLines={1} style={{ fontSize: 10 }}>
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
