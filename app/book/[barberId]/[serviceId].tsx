import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { barbers } from "../../data";
import "../../global.css";

export default function Booking() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const barberId = params.barberId as string | undefined;
  const serviceId = params.serviceId as string | undefined;

  const barber = useMemo(() => barbers.find((b) => b.id === barberId), [barberId]);
  const service = useMemo(() => barber?.services.find((s) => s.id === serviceId), [barber, serviceId]);

  const [dateIndex, setDateIndex] = useState(0);
  const [timeIndex, setTimeIndex] = useState(0);

  const dates = useMemo(() => {
    const arr = [] as string[];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toDateString());
    }
    return arr;
  }, []);

  const times = ["09:00", "10:00", "11:00", "13:00", "15:00", "17:00"];

  if (!barber || !service) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-300">Booking item not found.</Text>
      </View>
    );
  }

  function confirm() {
    Alert.alert("Booking confirmed", `You booked ${service!.name} at ${barber!.name} on ${dates[dateIndex]} at ${times[timeIndex]}`);
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-sm text-neutral-300">← Back</Text>
      </TouchableOpacity>

      <View className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
        <View className="flex-row items-center">
          <Image source={{ uri: barber.logo }} className="w-20 h-20 rounded-full mr-4" />
          <View>
            <Text className="text-lg font-PlayfairB text-white">{barber.name}</Text>
            <Text className="text-sm text-neutral-300">{service.name}</Text>
            <Text className="text-sm text-neutral-400 mt-1">{service.duration} • {service.price}</Text>
          </View>
        </View>

        <Text className="text-sm text-neutral-300 mt-4 mb-2">Choose date</Text>
        <View className="flex-row gap-2 mb-4">
          {dates.map((d, i) => (
            <TouchableOpacity key={d} onPress={() => setDateIndex(i)} className={`px-3 py-2 rounded-md ${dateIndex === i ? 'bg-[#FFD60A]' : 'bg-neutral-800'}`}>
              <Text className={`${dateIndex === i ? 'text-dark font-bold' : 'text-neutral-300'}`}>{new Date(d).toLocaleDateString()}</Text>
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
          <Text className="text-dark font-bold">Confirm booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
