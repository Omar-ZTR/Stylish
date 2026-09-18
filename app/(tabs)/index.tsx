import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { api, type Barber } from "@/src/lib/api";
import { news, salesPacks, stories } from "@/src/data";
import "../global.css";
export default function Index() {
  const router = useRouter();
  const [nearbyBarbers, setNearbyBarbers] = useState<Barber[]>([]);
  // const services = [
  //   {
  //     id: "1",
  //     name: "Classic Haircut",
  //     price: "25 TND",
  //     duration: "30 min",
  //     image:
  //       "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  //   },
  //   {
  //     id: "2",
  //     name: "Beard Trim",
  //     price: "15 TND",
  //     duration: "20 min",
  //     image:
  //       "https://framerusercontent.com/images/ynNDEztFybyvUnSV7H6bQzOCIp4.jpg",
  //   },
  //   {
  //     id: "3",
  //     name: "Hair + Beard Combo",
  //     price: "35 TND",
  //     duration: "45 min",
  //     image:
  //       "https://framerusercontent.com/images/ynNDEztFybyvUnSV7H6bQzOCIp4.jpg",
  //   },
  //   {
  //     id: "4",
  //     name: "Facial Treatment",
  //     price: "30 TND",
  //     duration: "40 min",
  //     image:
  //       "https://framerusercontent.com/images/ynNDEztFybyvUnSV7H6bQzOCIp4.jpg",
  //   },
  //   {
  //     id: "5",
  //     name: "Hot Towel Shave",
  //     price: "20 TND",
  //     duration: "25 min",
  //     image:
  //       "https://framerusercontent.com/images/ynNDEztFybyvUnSV7H6bQzOCIp4.jpg",
  //   },
  //   {
  //     id: "6",
  //     name: "Kids Haircut",
  //     price: "18 TND",
  //     duration: "25 min",
  //     image:
  //       "https://framerusercontent.com/images/ynNDEztFybyvUnSV7H6bQzOCIp4.jpg",
  //   },
  // ];
  const [viewingStory, setViewingStory] = useState<string | null>(null);

  useEffect(() => {
    api.getBarbers().then(({ barbers }) => setNearbyBarbers(barbers)).catch(() => setNearbyBarbers([]));
  }, []);

  const currentStory = stories.find(s => s.id === viewingStory);
  const currentStoryIndex = stories.findIndex(s => s.id === viewingStory);

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setViewingStory(stories[currentStoryIndex + 1].id);
    } else {
      setViewingStory(null);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setViewingStory(stories[currentStoryIndex - 1].id);
    }
  };
  return (
    <View className="flex-1 bg-background">
      {/* Story Modal */}
      <Modal
        visible={!!viewingStory && !!currentStory}
        animationType="fade"
        transparent
      >
        <View className="flex-1 bg-black justify-center items-center">
          {currentStory && (
            <>
              {/* Story Image */}
              <Image
                source={{ uri: currentStory.image }}
                className="w-full h-full"
                resizeMode="cover"
              />

              {/* Close button */}
              <TouchableOpacity
                onPress={() => setViewingStory(null)}
                className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
              >
                <MaterialIcons name="close" size={28} color="#FFD60A" />
              </TouchableOpacity>

              {/* Story info */}
              <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <Text className="text-white text-2xl font-PlayfairB">
                  {currentStory.title}
                </Text>
                <Text className="text-neutral-300 text-sm mt-2">
                  Tap the sides to navigate
                </Text>
              </View>

              {/* Navigation - Left side */}
              <TouchableOpacity
                onPress={handlePrevStory}
                className="absolute left-4 top-1/2 z-40 p-4"
              >
                <MaterialIcons
                  name="chevron-left"
                  size={40}
                  color={currentStoryIndex > 0 ? "#FFD60A" : "#666"}
                />
              </TouchableOpacity>

              {/* Navigation - Right side */}
              <TouchableOpacity
                onPress={handleNextStory}
                className="absolute right-4 top-1/2 z-40 p-4"
              >
                <MaterialIcons
                  name="chevron-right"
                  size={40}
                  color={currentStoryIndex < stories.length - 1 ? "#FFD60A" : "#666"}
                />
              </TouchableOpacity>

              {/* Story indicator */}
              <View className="absolute top-6 left-0 right-0 flex-row justify-center gap-1 px-4">
                {stories.map((_, index) => (
                  <View
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index === currentStoryIndex
                        ? "bg-[#FFD60A]"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ---------- SCROLL CONTENT ---------- */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        {/* Welcome and primary actions */}
        <View className="mb-6">
          <Text className="text-neutral-400 text-sm">Good morning, Ahmed</Text>
          <Text className="text-white text-3xl font-PlayfairB mt-1">Find your next look</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/search")}
            className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 mt-4"
            activeOpacity={0.8}
          >
            <MaterialIcons name="search" size={22} color="#FFD60A" />
            <Text className="text-neutral-400 ml-3 flex-1">Search barbers, services or offers</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFD60A" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-7">
          {[
            { label: "Book a cut", icon: "content-cut", route: "/(tabs)/search" },
            { label: "Saved", icon: "bookmark-border", route: "/(tabs)/favorites" },
            { label: "Bookings", icon: "event", route: "/(tabs)/profile" },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.route as any)}
              className="flex-1 items-center bg-neutral-900 border border-neutral-800 rounded-2xl py-4"
              activeOpacity={0.8}
            >
              <MaterialIcons name={action.icon as any} size={24} color="#FFD60A" />
              <Text className="text-white text-xs font-semibold mt-2 text-center">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby barbers: the fastest path from discovery to booking */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-PlayfairB">Nearby barbers</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <Text className="text-[#FFD60A] text-sm font-semibold">See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={nearbyBarbers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/barber/${item.id}`)}
                className="w-44 mr-3 bg-neutral-900 rounded-2xl border border-neutral-800 p-3"
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.logoUrl }} className="w-full h-24 rounded-xl" />
                <Text className="text-white font-semibold mt-3" numberOfLines={1}>{item.name}</Text>
                <Text className="text-neutral-400 text-xs mt-1" numberOfLines={1}>{item.location}</Text>
                <View className="flex-row items-center mt-2">
                  <MaterialIcons name="star" size={15} color="#FFD60A" />
                  <Text className="text-[#FFD60A] text-xs ml-1">{item.rating.toFixed(1)}</Text>
                  <Text className="text-neutral-500 text-xs ml-2">{item.distanceKm} km</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Offers are kept separate from social updates for quicker scanning */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-PlayfairB">Offers for you</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <Text className="text-[#FFD60A] text-sm font-semibold">Browse</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {salesPacks.slice(0, 3).map((pack) => (
              <TouchableOpacity key={pack.id} className="w-56 mr-3 bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800" onPress={() => router.push("/(tabs)/search")}>
                <Image source={{ uri: pack.image }} className="w-full h-24" />
                <View className="p-3">
                  <Text className="text-white font-semibold" numberOfLines={1}>{pack.title}</Text>
                  <Text className="text-[#FFD60A] text-xs mt-1">{pack.discount} • {pack.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stories Section - Like Instagram */}
        {/* <View className="mb-6">
          <FlatList
            data={stories}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setViewingStory(item.id)}
                className="mr-4 items-center"
              >
                <View className="relative">
                  <Image
                    source={{ uri: item.image }}
                    className="w-20 h-20 rounded-full border-2 border-[#FFD60A] overflow-hidden"
                  />
                  <View className="absolute inset-0 bg-black/20 rounded-full" />
                </View>
                <Text className="text-white text-xs mt-2 text-center w-20">
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View> */}

        {/* Actualité (News) Section */}
        <View className="mb-6">
          <Text className="text-white text-lg font-PlayfairB mb-4">Actualité</Text>
          <View className="space-y-4">
            {news.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-neutral-900 rounded-l overflow-hidden border border-neutral-800 py-8 my-2"
              >
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-4">
                  {/* Barber info */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: item.barberLogo }}
                      className="w-8 h-8 rounded-full mr-2 border border-[#FFD60A]"
                    />
                    <View className="flex-1">
                      <Text className="text-white text-sm font-semibold">
                        {item.barber}
                      </Text>
                      <Text className="text-neutral-500 text-xs">
                        {item.date}
                      </Text>
                    </View>
                  </View>

                  {/* News content */}
                  <Text className="text-white text-base font-PlayfairB mb-2">
                    {item.title}
                  </Text>
                  <Text className="text-neutral-300 text-sm">
                    {item.excerpt}
                  </Text>

                  {/* Like and share buttons */}
                  <View className="flex-row gap-4 mt-4">
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <MaterialIcons name="favorite-border" size={18} color="#FFD60A" />
                      <Text className="text-neutral-300 text-xs">Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <MaterialIcons name="comment" size={18} color="#FFD60A" />
                      <Text className="text-neutral-300 text-xs">Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <MaterialIcons name="share" size={18} color="#FFD60A" />
                      <Text className="text-neutral-300 text-xs">Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

