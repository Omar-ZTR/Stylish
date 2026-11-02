import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ALL_WEEKDAYS, WEEKDAYS } from "@/src/lib/barberSchedule";

interface WeekdaySelectorProps {
  days: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  accentColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

export default function WeekdaySelector({
  days,
  onChange,
  disabled = false,
  accentColor = "#FFD60A",
  textColor = "#FFFFFF",
  mutedTextColor = "#A3A3A3",
}: WeekdaySelectorProps) {
  const allSelected = WEEKDAYS.every(({ value }) => days.includes(value));

  const toggleDay = (day: number) => {
    if (days.includes(day)) {
      if (days.length > 1) onChange(days.filter((value) => value !== day));
      return;
    }

    onChange([...days, day].sort((a, b) => a - b));
  };

  return (
    <View className="rounded-2xl border p-4" style={{ backgroundColor: "rgba(255,255,255,0.025)", borderColor: "rgba(163,163,163,0.16)" }}>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold" style={{ color: textColor }}>Open days</Text>
          <Text className="mt-1 text-xs" style={{ color: mutedTextColor }}>Tap a day to mark it open or off</Text>
        </View>
        <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}55` }}>
          <Text className="text-xs font-bold" style={{ color: accentColor }}>
            {allSelected ? "7 DAYS" : `${days.length} OF 7`}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-1.5">
        {WEEKDAYS.map(({ value, label }) => {
          const selected = days.includes(value);
          return (
            <Pressable
              key={value}
              onPress={() => toggleDay(value)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityLabel={`${label}, ${selected ? "open" : "closed"}`}
              accessibilityState={{ checked: selected, disabled }}
              className="flex-1 items-center justify-center rounded-xl border py-2.5"
              style={{
                minHeight: 62,
                backgroundColor: selected ? `${accentColor}20` : "rgba(255,255,255,0.025)",
                borderColor: selected ? `${accentColor}99` : "rgba(163,163,163,0.18)",
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: selected ? accentColor : mutedTextColor }}>
                {label}
              </Text>
              <View
                className="mt-2 h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: selected ? accentColor : "rgba(163,163,163,0.12)" }}
              >
                {selected ? (
                  <MaterialIcons name="check" size={14} color="#111111" />
                ) : (
                  <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mutedTextColor }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onChange([...ALL_WEEKDAYS])}
        disabled={disabled || allSelected}
        accessibilityRole="button"
        accessibilityLabel="Open all week"
        accessibilityState={{ selected: allSelected, disabled: disabled || allSelected }}
        className="mt-3 flex-row items-center justify-between rounded-xl border px-3.5 py-3"
        style={{
          backgroundColor: allSelected ? `${accentColor}12` : "rgba(255,255,255,0.025)",
          borderColor: allSelected ? `${accentColor}55` : "rgba(163,163,163,0.18)",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <View className="flex-row items-center">
          <View
            className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <MaterialIcons name={allSelected ? "event-available" : "date-range"} size={18} color={accentColor} />
          </View>
          <View>
            <Text className="text-xs font-bold" style={{ color: allSelected ? accentColor : textColor }}>
              All week
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: mutedTextColor }}>
              {allSelected ? "You're open every day" : "Set every day as open"}
            </Text>
          </View>
        </View>
        <MaterialIcons
          name={allSelected ? "check-circle" : "arrow-forward"}
          size={20}
          color={allSelected ? accentColor : mutedTextColor}
        />
      </Pressable>
    </View>
  );
}
