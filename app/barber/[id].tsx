import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api, type Barber } from "@/src/lib/api";
import { salesPacks } from "@/src/data";
import "../global.css";

export default function BarberProfile() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params.id as string | undefined;
  const [barber, setBarber] = useState<Barber | null>(null);
  useEffect(() => {
    if (id) api.getBarber(id).then(({ barber: result }) => setBarber(result)).catch(() => setBarber(null));
  }, [id]);

  const [tab, setTab] = useState<"about" | "news" | "services" | "packs">("about");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [dateIndex, setDateIndex] = useState(0);
  const [timeIndex, setTimeIndex] = useState(0);

  if (!barber) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-300">Barber not found.</Text>
      </View>
    );
  }

  const dates = (() => {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toDateString());
    }
    return arr;
  })();

  const times = ["09:00", "10:00", "11:00", "13:00", "15:00", "17:00"];

  // mock news items (could be fetched later)
  const news = [
    {
      id: "n1",
      title: "Fresh fade styles this week",
      excerpt: "New fade techniques and discounts on student cuts.",
      image: "https://picsum.photos/600/400?random=21",
      date: "2 days ago",
    },
    {
      id: "n2",
      title: "Beard-care tips",
      excerpt: "Learn the daily routine to keep your beard sharp.",
      image: "https://picsum.photos/600/400?random=22",
      date: "1 week ago",
    },
  ];

  const bio = `${barber.name} is an experienced barber offering premium cuts and grooming services. Friendly vibe and attention to detail.`;

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-4 left-4 z-10 bg-black/60 p-2 rounded-full"
      >
        <Text className="text-[#FFD60A] text-xl">←</Text>
      </TouchableOpacity>

      <View className="h-44 w-full">
        <Image source={{ uri: barber.logoUrl }} className="w-full h-full opacity-50" resizeMode="cover" />
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </View>

      <View className="-mt-16 px-4">
        <View className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 shadow-soft">
          <View className="flex-row items-center">
            <Image source={{ uri: barber.logoUrl }} className="w-28 h-28 rounded-full border-2 border-[#FFD60A] mr-4" />
            <View className="flex-1">
              <Text className="text-2xl font-PlayfairB text-white">{barber.name}</Text>
              <Text className="text-sm text-neutral-300 mt-1">📍 {barber.location}</Text>
              <View className="flex-row items-center mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Text key={i} className={`text-base ${i <= Math.round(barber.rating) ? "text-[#FFD60A]" : "text-neutral-500"}`}>★</Text>
                ))}
                <Text className="text-sm text-neutral-500 ml-2">{barber.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>

          <Text className="text-sm text-neutral-300 mt-4">{bio}</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mt-4 bg-neutral-900 rounded-full p-1 border border-neutral-800">
          <TouchableOpacity onPress={() => setTab("about")} className={`flex-1 items-center py-2 rounded-full ${tab === "about" ? "bg-[#FFD60A]" : ""}`}>
            <Text className={`${tab === "about" ? "text-dark font-bold" : "text-neutral-300"}`}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab("news")} className={`flex-1 items-center py-2 rounded-full ${tab === "news" ? "bg-[#FFD60A]" : ""}`}>
            <Text className={`${tab === "news" ? "text-dark font-bold" : "text-neutral-300"}`}>Actualité</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab("services")} className={`flex-1 items-center py-2 rounded-full ${tab === "services" ? "bg-[#FFD60A]" : ""}`}>
            <Text className={`${tab === "services" ? "text-dark font-bold" : "text-neutral-300"}`}>Services</Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        <View className="mt-4">
          {tab === "about" && (
            <View>
              <Text className="text-lg font-PlayfairB text-white mb-2">Welcome</Text>
              <Text className="text-sm text-neutral-300">{bio}</Text>
            </View>
          )}

          {tab === "news" && (
            <View className="space-y-4">
              {news.map((n) => (
                <View key={n.id} className="bg-neutral-900 rounded-md overflow-hidden border border-neutral-800">
                  <Image source={{ uri: n.image }} className="w-full h-40" resizeMode="cover" />
                  <View className="p-3">
                    <Text className="text-base font-PlayfairB text-white">{n.title}</Text>
                    <Text className="text-sm text-neutral-300 mt-1">{n.excerpt}</Text>
                    <Text className="text-xs text-neutral-500 mt-2">{n.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === "services" && (
            <View>
              <Text className="text-lg font-PlayfairB text-white mb-3">Services</Text>
              <View className="flex-row flex-wrap justify-between">
                {barber.services.map((s) => {
                  const selected = selectedServices.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => {
                        setSelectedServices((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]));
                      }}
                      className={`w-[48%] mb-3 bg-neutral-900 p-3 rounded-md border ${selected ? "border-[#FFD60A] bg-[#FFD60A11]" : "border-neutral-800"} items-center relative`}
                    >
                      <Image source={{ uri: s.imageUrl }} className="w-20 h-20 rounded-md mb-3" />
                      <Text className="text-base text-white font-semibold text-center">{s.name}</Text>
                      <Text className="text-sm text-neutral-300 mt-1">{s.price} TND • {s.durationMinutes} min</Text>

                      {/* <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          router.push(`/book/${barber.id}/${s.id}` as any);
                        }}
                        className="absolute bottom-2 right-2 bg-[#FFD60A] px-2 py-1 rounded"
                      >
                        <Text className="text-dark text-xs font-bold">Book</Text>
                      </TouchableOpacity> */}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        {/* Booking modal (summary) */}
        <Modal visible={showBookingModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-2xl p-4 max-h-[80%]">
              <Text className="text-lg font-PlayfairB text-white mb-2">Confirm Booking</Text>
              <Text className="text-sm text-neutral-300 mb-3">Selected services ({selectedServices.length})</Text>
              <View className="space-y-2 mb-3">
                {barber.services
                  .filter((s) => selectedServices.includes(s.id))
                  .map((s) => (
                    <View key={s.id} className="flex-row justify-between items-center">
                      <Text className="text-white">{s.name}</Text>
                      <Text className="text-neutral-300">{s.price}</Text>
                    </View>
                  ))}
              </View>

              <Text className="text-sm text-neutral-300 mb-2">Choose date</Text>
              <View className="flex-row gap-2 mb-3">
                {dates.map((d, i) => (
                  <TouchableOpacity key={d} onPress={() => setDateIndex(i)} className={`px-3 py-2 rounded-md ${dateIndex === i ? 'bg-[#FFD60A]' : 'bg-neutral-800'}`}>
                    <Text className={`${dateIndex === i ? 'text-dark font-bold' : 'text-neutral-300'}`}>{new Date(d).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm text-neutral-300 mb-2">Choose time</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {times.map((t, i) => (
                  <TouchableOpacity key={t} onPress={() => setTimeIndex(i)} className={`px-3 py-2 rounded-md ${timeIndex === i ? 'bg-[#FFD60A]' : 'bg-neutral-800'}`}>
                    <Text className={`${timeIndex === i ? 'text-dark font-bold' : 'text-neutral-300'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row justify-between">
                <TouchableOpacity onPress={() => setShowBookingModal(false)} className="px-4 py-3 border border-neutral-700 rounded-lg">
                  <Text className="text-neutral-300">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowBookingModal(false);
                    const q = selectedServices.join(",");
                    router.push({
                      pathname: "/book/multi/[barberId]",
                      params: { barberId: barber.id, services: q }
                    });
                  }}
                  className="px-4 py-3 bg-[#FFD60A] rounded-lg"
                >
                  <Text className="text-dark font-bold">Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

          {tab === "packs" && (
            <View>
              <Text className="text-lg font-PlayfairB text-white mb-3">Packs & Offers</Text>
              <View className="space-y-4">
                {salesPacks.map((p) => (
                  <View key={p.id} className="bg-neutral-900 rounded-md overflow-hidden border border-neutral-800">
                    <Image source={{ uri: p.image }} className="w-full h-40" resizeMode="cover" />
                    <View className="p-3 flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-PlayfairB text-white">{p.title}</Text>
                        <Text className="text-sm text-neutral-300 mt-1">{p.description}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm text-neutral-300 mb-2">{p.price}</Text>
                        <Text className="text-xs text-[#FFD60A]">{p.discount}</Text>
                        <TouchableOpacity className="mt-3 bg-[#FFD60A] px-3 py-2 rounded-md">
                          <Text className="text-dark font-bold">Buy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
      {/* Bottom Book Selected button */}
      {selectedServices.length > 0 && (
        <View className="absolute bottom-6 left-4 right-4 z-50">
          <TouchableOpacity onPress={() => setShowBookingModal(true)} className="bg-[#FFD60A] py-3 rounded-full items-center">
            <Text className="text-dark font-bold">Book Selected ({selectedServices.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
