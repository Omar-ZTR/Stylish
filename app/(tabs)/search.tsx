import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal, Pressable, ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { api, type Barber } from "@/src/lib/api";
import { salesPacks } from "@/src/data";
import "../global.css";

export default function Search() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  // handleScroll moved below so it can safely close dropdowns when scrolling

  const [query, setQuery] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    api.getBarbers().then(({ barbers: results }) => setBarbers(results)).catch(() => setBarbers([]));
  }, []);
  const filteredSales = salesPacks.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredBarbers = barbers.filter((barber) => {
    const searchable = [
      barber.name,
      barber.location,
      ...barber.services.map((service) => service.name),
    ].join(" ").toLowerCase();
    return searchable.includes(query.toLowerCase());
  });

  // simple dropdown state (mirrors Index tab)
  const [kmOpen, setKmOpen] = useState(false);
  const [kmValue, setKmValue] = useState(null);
  const [kmItems, setKmItems] = useState([
    { label: "1 km", value: "1" },
    { label: "3 km", value: "3" },
    { label: "5 km", value: "5" },
    { label: "10 km", value: "10" },
  ]);

  const [cityOpen, setCityOpen] = useState(false);
  const [cityValue, setCityValue] = useState(null);
  const [cityItems, setCityItems] = useState([
    { label: "Tunis", value: "tunis" },
    { label: "Sousse", value: "sousse" },
    { label: "Ariana", value: "ariana" },
  ]);

  const dropdownStyle = {
    backgroundColor: "#1111115b",
    borderRadius: 10,
    borderWidth: 0,
    height: 40,
  };

  const dropdownContainer = { backgroundColor: "#1a1a1a" };
  const dropdownText = { color: "white", fontSize: 14, fontFamily: "Playfair" };

  // re-create scroll handler here so we can close dropdowns while scrolling
  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    // close any open dropdowns while the user scrolls for a cleaner UX
    try {
      setKmOpen(false);
      setCityOpen(false);
    } catch {
      // ignore if not yet defined
    }

    if (currentY > lastScrollY && currentY > 50) {
      setShowHeader(false);
    } else if (currentY < lastScrollY - 10) {
      setShowHeader(true);
    }
    setLastScrollY(currentY);
    // update animated value for any dependent animations
    if (typeof scrollY?.setValue === "function") scrollY.setValue(currentY);
  };

  // Filters & UI extras
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const popularTags = ["hair cut", "beard trim", "combo", "facial"];

  // derive unique services from data
  const uniqueServices = Array.from(
    new Set(barbers.flatMap((b) => b.services.map((s) => s.name)))
  );

  function toggleService(name: string) {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  function clearFilters() {
    setSelectedServices([]);
    setMinRating(0);
  }

  // apply filters to barbers/sales
  const resultsBarbers = filteredBarbers.filter((barber) => {
    if (minRating && barber.rating < minRating) return false;
    if (cityValue && !barber.location.toLowerCase().includes(String(cityValue))) return false;
    if (kmValue && barber.distanceKm > Number(kmValue)) return false;
    if (selectedServices.length > 0) {
      const barberServiceNames = barber.services.map((s) => s.name);
      if (!selectedServices.some((s) => barberServiceNames.includes(s))) return false;
    }
    return true;
  });

  const resultsSales = filteredSales; // keep sales simple for now
  const activeFilterCount = selectedServices.length + (minRating ? 1 : 0) + (kmValue ? 1 : 0) + (cityValue ? 1 : 0);
  const hasSearch = query.trim().length > 0;

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        style={{ transform: [{ translateY: showHeader ? 0 : -185 }] }}
        className="absolute top-0 left-0 right-0 z-10 bg-[#111111] px-4 pt-5 pb-4 shadow-soft border-b border-[#FFD60A22]"
      >
        <View className="flex-row items-end justify-between mb-4">
          <View>
            <Text className="text-neutral-400 text-xs uppercase tracking-widest">Discover</Text>
            <Text className="text-white text-3xl font-PlayfairB mt-1">Your next style</Text>
          </View>
          <View className="bg-[#FFD60A18] rounded-full px-3 py-2">
            <Text className="text-[#FFD60A] text-xs font-bold">{resultsBarbers.length} nearby</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="absolute left-3 z-10">
            <MaterialIcons name="search" color="#FFD60A" size={20} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search barbers, packs or services..."
            placeholderTextColor="#aaa"
            className="flex-1 h-12 rounded-2xl bg-neutral-900 pl-11 pr-10 text-white border border-neutral-700"
          />
          {hasSearch && (
            <TouchableOpacity className="absolute right-16 z-10" onPress={() => setQuery("")}>
              <MaterialIcons name="close" color="#9ca3af" size={19} />
            </TouchableOpacity>
          )}
          <TouchableOpacity className="ml-2 bg-[#FFD60A] rounded-2xl h-12 w-12 items-center justify-center" onPress={() => setFiltersVisible(true)}>
            <MaterialIcons name="tune" color="#111111" size={22} />
          </TouchableOpacity>
        </View>

        <View className="flex-row mt-4 gap-2">
          <View className="flex-1 z-50">
            <DropDownPicker
              open={kmOpen}
              value={kmValue}
              items={kmItems}
              setOpen={setKmOpen}
              setValue={setKmValue}
              setItems={setKmItems}
              placeholder="Km"
              style={dropdownStyle}
              dropDownContainerStyle={dropdownContainer}
              textStyle={dropdownText}
              ArrowUpIconComponent={() => (
                <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFD60A" />
              )}
              ArrowDownIconComponent={() => (
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFD60A" />
              )}
            />
          </View>

          <View className="flex-1 z-40">
            <DropDownPicker
              open={cityOpen}
              value={cityValue}
              items={cityItems}
              setOpen={setCityOpen}
              setValue={setCityValue}
              setItems={setCityItems}
              placeholder="City"
              style={dropdownStyle}
              dropDownContainerStyle={dropdownContainer}
              textStyle={dropdownText}
              ArrowUpIconComponent={() => (
                <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFD60A" />
              )}
              ArrowDownIconComponent={() => (
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFD60A" />
              )}
            />
          </View>
        </View>
        {/* suggestion chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {popularTags.map((t) => (
            <TouchableOpacity key={t} onPress={() => setQuery(t)} className="px-3 py-2 mr-2 bg-neutral-900 rounded-full border border-neutral-700">
              <Text className="text-xs text-neutral-300">{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 235, paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-xl font-PlayfairB">Curated for you</Text>
            <Text className="text-neutral-500 text-xs mt-1">Premium grooming, close to home</Text>
          </View>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} className="flex-row items-center">
              <Text className="text-[#FFD60A] text-xs font-semibold mr-1">{activeFilterCount} filters</Text>
              <MaterialIcons name="close" size={15} color="#FFD60A" />
            </TouchableOpacity>
          )}
        </View>
        {/* Sale packs horizontal */}
        <FlatList
          data={resultsSales}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={Dimensions.get("window").width - 16}
          decelerationRate="fast"
          snapToAlignment="start"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: Dimensions.get("window").width - 32 }}
              className="mr-4 h-[17rem] rounded-3xl overflow-hidden border border-[#FFD60A55]"
            >
              <ImageBackground source={{ uri: item.image }} resizeMode="cover" className="w-full h-full">
                <LinearGradient colors={["#000000ea", "#0000000e"] as const} start={{ x: 0.5, y: 1.0 }} end={{ x: 0.5, y: 0.0 }} className="flex-1 justify-end p-7">
                    <View>
                    <View className="self-start bg-[#FFD60A] rounded-full px-3 py-1 mb-2">
                      <Text className="text-black text-[10px] font-bold uppercase">Limited offer</Text>
                    </View>
                    <Text className="text-white font-PlayfairB text-xl drop-shadow-lg">{item.title}</Text>
                    <Text className="text-sm text-gray-200 mt-1">{item.discount} • {item.price}</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          )}
        />

        {resultsBarbers.map((barber) => (
          <TouchableOpacity key={barber.id} onPress={() => router.push(`/barber/${barber.id}`)} className="items-center bg-neutral-900 border border-neutral-800 p-4 shadow-soft mb-4 rounded-3xl">
            <View className="flex-row items-center w-full">
              <Image source={{ uri: barber.logoUrl }} className="w-16 h-16 rounded-full mr-4 border-2 border-[#FFD60A]" resizeMode="cover" />

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-lg font-PlayfairB text-white flex-1" numberOfLines={1}>{barber.name}</Text>
                  <View className="bg-emerald-500/15 rounded-full px-2 py-1">
                    <Text className="text-emerald-400 text-[10px] font-bold">OPEN</Text>
                  </View>
                </View>
                <Text className="text-sm text-neutral-300 mt-1">{barber.location} • {barber.distanceKm} km</Text>

                <View className="flex-row items-center mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <MaterialIcons
                      key={i}
                      name="star"
                      size={18}
                      color={i <= Math.round(barber.rating) ? "#FFD60A" : "#C5C5C5"}
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text className="text-sm font-PlayfairB ml-1 text-neutral-500">{barber.rating.toFixed(1)}</Text>
                </View>
              </View>

              <View className="items-center justify-center mr-2">
                <Text className="text-sm font-PlayfairEB text-neutral-300">{barber.startTime}</Text>
                <View className="w-[2px] h-6 bg-[#FFD60A] my-1" />
                <Text className="text-sm font-PlayfairEB text-neutral-300">{barber.endTime}</Text>
              </View>
            </View>

            <FlatList
              data={barber.services}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginTop: 16, paddingRight: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity className="rounded-2xl shadow-md ml-3 w-[10rem] h-[13rem] border border-[#FFD60A55] overflow-hidden">
                  <ImageBackground source={{ uri: item.imageUrl }} resizeMode="cover" className="w-full h-full justify-end" imageStyle={{ borderRadius: 8 }}>
                    <View className="absolute inset-0 bg-black/40 rounded-sm" />
                    <View className="p-3">
                      <Text className="text-base font-semibold text-white drop-shadow-lg">{item.name}</Text>
                      <Text className="text-gray-200 text-xs mt-1">{item.durationMinutes} min • {item.price} TND</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => router.push(`/barber/${barber.id}`)} className="flex-row items-center justify-center bg-[#FFD60A] rounded-xl py-3 mt-4 w-full">
              <MaterialIcons name="calendar-month" size={18} color="#111111" />
              <Text className="text-black font-bold ml-2">View availability</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {resultsBarbers.length === 0 && resultsSales.length === 0 && (
          <View className="items-center justify-center py-16 px-6">
            <View className="w-20 h-20 rounded-full bg-[#FFD60A18] items-center justify-center">
              <MaterialIcons name="search-off" size={38} color="#FFD60A" />
            </View>
            <Text className="text-white text-xl font-PlayfairB mt-5">No perfect match yet</Text>
            <Text className="text-neutral-400 text-sm text-center mt-2">Try another service, city, or remove a filter to explore more styles.</Text>
            <TouchableOpacity onPress={() => { setQuery(""); clearFilters(); }} className="bg-[#FFD60A] rounded-xl px-5 py-3 mt-5">
              <Text className="text-black font-bold">Reset discovery</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* Filters Modal */}
      <Modal visible={filtersVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-PlayfairB text-white">Filters</Text>
              <Pressable onPress={() => setFiltersVisible(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <ScrollView className="mb-4">
              <Text className="text-sm text-neutral-300 mb-2">Services</Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueServices.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => toggleService(s)}
                    className={`px-3 py-2 rounded-full border ${selectedServices.includes(s) ? "border-[#FFD60A] bg-[#FFD60A11]" : "border-neutral-700"}`}
                  >
                    <Text className="text-sm text-neutral-200">{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm text-neutral-300 mt-4 mb-2">Minimum rating</Text>
              <View className="flex-row items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((r) => (
                  <TouchableOpacity key={r} onPress={() => setMinRating(r)} className={`px-3 py-2 rounded-md ${minRating === r ? "bg-[#FFD60A]" : "bg-neutral-900"}`}>
                    <Text className={`text-sm ${minRating === r ? "text-dark" : "text-neutral-300"}`}>{r === 0 ? 'Any' : `${r}+`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => { clearFilters(); }} className="px-4 py-3 border border-neutral-700 rounded-lg">
                <Text className="text-neutral-300">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltersVisible(false)} className="px-4 py-3 bg-[#FFD60A] rounded-lg">
                <Text className="text-dark font-bold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}