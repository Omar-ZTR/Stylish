import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROW_HEIGHT = 48;
const VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const WHEEL_PADDING = ROW_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

interface TimeWheelPickerProps {
  value: string;
  onConfirm: (value: string) => void;
  label?: string;
  compact?: boolean;
}

interface WheelColumnProps {
  column: string;
  values: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
}

function WheelColumn({ column, values, selectedValue, onValueChange }: WheelColumnProps) {
  const selectedIndex = values.indexOf(selectedValue);
  const [scrollY] = useState(() => new Animated.Value(Math.max(0, selectedIndex) * ROW_HEIGHT));
  const listRef = useRef<FlatList<number>>(null);

  const updateSelection = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / ROW_HEIGHT)));
    onValueChange(values[index]);
  };

  const scrollToValue = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * ROW_HEIGHT, animated: true });
    onValueChange(values[index]);
  };

  return (
    <View className="flex-1">
      <View
        className="overflow-hidden"
        style={{ height: WHEEL_HEIGHT }}
      >
        <Animated.FlatList
          ref={listRef}
          data={values}
          keyExtractor={(item) => `${column}-${item}`}
          initialScrollIndex={Math.max(0, selectedIndex)}
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
          contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={ROW_HEIGHT}
          snapToAlignment="start"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          onScrollEndDrag={updateSelection}
          onMomentumScrollEnd={updateSelection}
          renderItem={({ item, index }) => {
            const opacity = scrollY.interpolate({
              inputRange: [
                (index - 1) * ROW_HEIGHT,
                index * ROW_HEIGHT,
                (index + 1) * ROW_HEIGHT,
              ],
              outputRange: [0.2, 1, 0.2],
              extrapolate: "clamp",
            });
            return (
              <TouchableOpacity
                onPress={() => scrollToValue(index)}
                activeOpacity={0.8}
                style={{ height: ROW_HEIGHT, alignItems: "center", justifyContent: "center" }}
              >
                <Animated.Text
                  style={{
                    opacity,
                    color: item === selectedValue ? "#FFFFFF" : "#D1D5DB",
                    fontSize: 34,
                    fontWeight: item === selectedValue ? "500" : "400",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {String(item).padStart(2, "0")}
                </Animated.Text>
              </TouchableOpacity>
            );
          }}
        />
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 border-y border-white/10"
          style={{
            top: WHEEL_PADDING,
            height: ROW_HEIGHT,
            backgroundColor: "rgba(255,255,255,0.025)",
          }}
        />
      </View>
    </View>
  );
}

export default function TimeWheelPicker({ value, onConfirm, label = "Pick time", compact = false }: TimeWheelPickerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState({ hour: 9, minute: 0 });

  const openPicker = () => {
    Keyboard.dismiss();
    const [hour, minute] = value.split(":").map(Number);
    setDraft({
      hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9,
      minute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0,
    });
    setVisible(true);
  };

  const confirmPicker = () => {
    onConfirm(`${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}, currently ${value}`}
        activeOpacity={0.82}
        className={`flex-row items-center rounded-2xl border border-[#FFBE0B]/35 ${compact ? "justify-center px-2 py-3" : "justify-between px-4 py-3.5"}`}
        style={{ backgroundColor: "rgba(42,35,18,0.72)" }}
      >
        {!compact ? (
          <View className="w-10 h-10 items-center justify-center rounded-xl bg-[#FFBE0B]/10">
            <Ionicons name="time-outline" size={21} color="#FFBE0B" />
          </View>
        ) : null}
        <View className={compact ? "flex-row items-center" : "ml-3"}>
          {!compact ? (
            <Text className="text-neutral-400 text-xs">{label}</Text>
          ) : null}
          <Text className={`text-white font-bold ${compact ? "text-base" : "text-lg mt-0.5"}`}>{value}</Text>
        </View>
        {!compact ? <Ionicons name="chevron-down" size={20} color="#FFBE0B" /> : <Ionicons name="time-outline" size={16} color="#FFBE0B" style={{ marginLeft: 6 }} />}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-5 bg-black/70"
          style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={() => setVisible(false)}
            className="absolute left-0 right-0 top-0 bottom-0"
            accessibilityRole="button"
            accessibilityLabel="Cancel time selection"
          />
          <View
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 px-5 pt-6"
            style={{
              backgroundColor: "rgba(22,20,16,0.97)",
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-neutral-700 mb-4" />
              <Text className="text-white text-xl font-semibold">Pick a time</Text>
            </View>

            {visible ? (
              <>
                <View className="flex-row items-center rounded-2xl px-3" style={{ backgroundColor: "rgba(7,10,14,0.68)" }}>
                  <WheelColumn
                    column="hours"
                    values={HOURS}
                    selectedValue={draft.hour}
                    onValueChange={(hour) => setDraft((current) => ({ ...current, hour }))}
                  />
                  <Text
                    className="text-white text-4xl font-light mx-2"
                    style={{ fontVariant: ["tabular-nums"], marginTop: 0 }}
                  >
                    :
                  </Text>
                  <WheelColumn
                    column="minutes"
                    values={MINUTES}
                    selectedValue={draft.minute}
                    onValueChange={(minute) => setDraft((current) => ({ ...current, minute }))}
                  />
                </View>

                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity
                    onPress={() => setVisible(false)}
                    activeOpacity={0.8}
                    className="flex-1 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 py-3.5"
                  >
                    <Text className="text-neutral-300 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmPicker}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm selected time"
                    activeOpacity={0.86}
                    className="flex-1"
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
                      <Ionicons name="checkmark-circle-outline" size={20} color="#30230C" />
                      <Text className="text-[#30230C] text-center font-bold ml-2">Confirm time</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
