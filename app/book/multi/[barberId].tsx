import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api, type Barber } from "@/src/lib/api";
import "../../global.css";

export default function MultiBooking() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const barberId = params.barberId as string | undefined;
  const servicesParam = (params.services as string | undefined) ?? "";
  const serviceIds = servicesParam.split(",").filter(Boolean);

  const [barber, setBarber] = useState<Barber | null>(null);
  useEffect(() => {
    if (barberId) api.getBarber(barberId).then(({ barber: result }) => setBarber(result)).catch(() => setBarber(null));
  }, [barberId]);
  const selectedServices = useMemo(() => barber?.services.filter((s) => serviceIds.includes(s.id)) ?? [], [barber, serviceIds]);

  const [dateIndex, setDateIndex] = useState(0);
  const [timeIndex, setTimeIndex] = useState(0);

  const dates = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  const times = ["09:00", "10:00", "11:00", "13:00", "15:00", "17:00"];

  if (!barber) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-300">Booking item not found.</Text>
      </View>
    );
  }

  async function confirm() {
    if (!barber) return;
    const names = selectedServices.map((s) => s.name).join(", ");
    try {
      await api.createBooking({ barberId: barber.id, serviceIds, bookingDate: dates[dateIndex], startTime: times[timeIndex] });
      Alert.alert("Booking confirmed", `You booked ${names} at ${barber.name}.`);
      router.replace("/(tabs)/profile");
    } catch (error) {
      Alert.alert("Booking unavailable", error instanceof Error ? error.message : "Please try another time.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-sm text-neutral-300">← Back</Text>
      </TouchableOpacity>

      <View className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
        <Text className="text-lg font-PlayfairB text-white mb-2">Booking ({selectedServices.length})</Text>
        {selectedServices.map((s) => (
          <View key={s.id} className="flex-row justify-between items-center mb-2">
            <Text className="text-white">{s.name}</Text>
            <Text className="text-neutral-300">{s.price}</Text>
          </View>
        ))}

        <Text className="text-sm text-neutral-300 mt-4 mb-2">Choose date</Text>
        <View className="flex-row gap-2 mb-4">
          {dates.map((d, i) => (
            <TouchableOpacity key={d} onPress={() => setDateIndex(i)} className={`px-3 py-2 rounded-md ${dateIndex === i ? 'bg-[#FFD60A]' : 'bg-neutral-800'}`}>
              <Text className={`${dateIndex === i ? 'text-dark font-bold' : 'text-neutral-300'}`}>{new Date(`${d}T12:00:00`).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm text-neutral-300 mt-2 mb-2">Choose time</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {times.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => setTimeIndex(i)} className={`px-3 py-2 rounded-md ${timeIndex === i ? 'bg-[#FFD60A]' : 'bg-neutral-800'}`}>
              <Text className={`${timeIndex === i ? 'text-dark font-bold' : 'text-neutral-300'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={confirm} className="w-full bg-[#FFD60A] py-3 rounded-md items-center mt-2">
          <Text className="text-dark font-bold">Confirm booking ({selectedServices.length})</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
