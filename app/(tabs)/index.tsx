import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { barbers, salesPacks } from "../data";
import "../global.css";
export default function Index() {
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;
        if (currentY > lastScrollY && currentY > 50) {
          // Scrolling down
          setShowHeader(false);
        } else if (currentY < lastScrollY - 10) {
          // Scrolling up
          setShowHeader(true);
        }
        setLastScrollY(currentY);
      },
    }
  );
  const kmOptions = [
  { label: "0 - 5 km", value: "5" },
  { label: "5 - 10 km", value: "10" },
  { label: "10 - 20 km", value: "20" }
];
  const [search, setSearch] = useState("");

 const filteredSales = salesPacks.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBarbers = barbers.filter((barber) =>
    barber.name.toLowerCase().includes(search.toLowerCase())
  );
  const [showKm, setShowKm] = useState(false);
const [showCity, setShowCity] = useState(false);
const [showService, setShowService] = useState(false);
const [showRating, setShowRating] = useState(false);


// KM
const [kmOpen, setKmOpen] = useState(false);
const [kmValue, setKmValue] = useState(null);
const [kmItems, setKmItems] = useState([
  { label: "1 km", value: "1" },
  { label: "3 km", value: "3" },
  { label: "5 km", value: "5" },
  { label: "10 km", value: "10" },
]);

// CITY
const [cityOpen, setCityOpen] = useState(false);
const [cityValue, setCityValue] = useState(null);
const [cityItems, setCityItems] = useState([
  { label: "Tunis", value: "tunis" },
  { label: "Sousse", value: "sousse" },
  { label: "Ariana", value: "ariana" },
]);

// RATING
const [ratingOpen, setRatingOpen] = useState(false);
const [ratingValue, setRatingValue] = useState(null);
const [ratingItems, setRatingItems] = useState([
  { label: "⭐ 1+", value: 1 },
  { label: "⭐ 2+", value: 2 },
  { label: "⭐ 3+", value: 3 },
  { label: "⭐ 4+", value: 4 },
  { label: "⭐ 5", value: 5 },
]);
const dropdownStyle = {
  backgroundColor: "#1111115b",
  borderRadius: 10,
  borderWidth: 0,
  
  height: 40,
};

const dropdownContainer = {
  backgroundColor: "#1a1a1a",
 


 
};

const dropdownText = {
  color: "white",
  fontSize: 14,
  fontFamily: "Playfair",
};
  return (
    <View className="flex-1 bg-background">
      {/* ---------- ANIMATED HEADER ---------- */}
      <Animated.View
        style={{
          transform: [{ translateY: showHeader ? 0 : -100 }],
        }}
        className="
    absolute 
    top-0 left-0 right-0 
    z-10
    bg-white 
    px-4 py-5
    shadow-soft
    border-2 
    border-[#FFD60A22]
   
  "
      >
        <View className="flex-row items-center ">
      <MaterialIcons name="pin-drop" color="#aaa" size={20} />
          <Text className="text-l text-[#FFD60A] font-PlayfairB">Tunis</Text>
    
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search sale packs..."
          placeholderTextColor="#aaa"
          className="flex-1 h-12 rounded-xl bg-neutral-900 px-4 text-white border border-neutral-700"
        />
 </View>
        {/* --- FILTER DROPDOWNS ROW --- */}
  <View className="flex-row mt-4 gap-1">
    
    
  {/* KM */}
  <View className="flex-1 z-50 ">
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
      // NEW WAY (SUPPORTED)
  ArrowUpIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFD60A" />
  )}
  ArrowDownIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFD60A" />
  )}
    />
  </View>

  {/* CITY */}
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
     // NEW WAY (SUPPORTED)
  ArrowUpIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFD60A" />
  )}
  ArrowDownIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFD60A" />
  )}
    />
  </View>

  {/* RATING */}
  <View className="flex-1 z-30">
    <DropDownPicker
      open={ratingOpen}
      value={ratingValue}
      items={ratingItems}
      setOpen={setRatingOpen}
      setValue={setRatingValue}
      setItems={setRatingItems}
      placeholder="Rating"
      style={dropdownStyle}
      dropDownContainerStyle={dropdownContainer}
      textStyle={dropdownText}
     // NEW WAY (SUPPORTED)
  ArrowUpIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFD60A" />
  )}
  ArrowDownIconComponent={() => (
    <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFD60A" />
  )}
    />
  </View>
   
    </View>
      </Animated.View>

      {/* ---------- SCROLL CONTENT ---------- */}
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16 }}
      >
        <FlatList
          data={filteredSales}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={Dimensions.get("window").width - 16}
          decelerationRate="fast"
          snapToAlignment="start"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: Dimensions.get("window").width - 32 }}
              className="mr-4 h-[20rem] rounded-lg overflow-hidden"
            >
              <ImageBackground
                source={{ uri: item.image }}
                resizeMode="cover"
                className="w-full h-full"
              >
                <LinearGradient
                  colors={["#000000ea", "#0000000e"]}
                  start={{ x: 0.5, y: 1.0 }}
                  end={{ x: 0.5, y: 0.0 }}
                  className="flex-1 justify-end p-7"
                >
                  <View>
                    <Text className="text-white font-PlayfairB text-base drop-shadow-lg">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-200">
                      {item.discount} • {item.price}
                    </Text>

                    <View className="flex-row items-center mt-2 gap-2">
                      <Text className="text-sm text-gray-200 font-PlayfairB drop-shadow-lg border-2 border-[#FFD60A] rounded-lg px-2">
                        hair cut
                      </Text>
                      <Text className="text-sm text-gray-200 font-PlayfairB drop-shadow-lg border-2 border-[#FFD60A] rounded-lg px-2">
                        hair cut
                      </Text>
                      <Text className="text-sm text-gray-200 font-PlayfairB drop-shadow-lg border-2 border-[#FFD60A] rounded-lg px-2">
                        hair cut
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          )}
        />

        {filteredBarbers.map((barber) => (
          <View
            key={barber.id}
            className="items-center bg-background border-b-2 border-l-2 border-neutral-800 p-4 shadow-soft mb-4 rounded-md"
          >
            {/* Header section */}
            <View className="flex-row items-center w-full">
              <Image
                source={{ uri: barber.logo }}
                className="w-16 h-16 rounded-full mr-4 border-2 border-[#FFD60A]"
                resizeMode="cover"
              />

              <View className="flex-1">
                <Text className="text-lg font-PlayfairB text-white">
                  {barber.name}
                </Text>
                <Text className="text-sm text-neutral-300 mt-1">
                  📍 {barber.location} • {barber.distance}
                </Text>

                {/* Rating stars */}
                <View className="flex-row items-center mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <MaterialIcons
                      key={i}
                      name="star"
                      size={18}
                      color={
                        i <= Math.round(barber.rating) ? "#FFD60A" : "#C5C5C5"
                      }
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text className="text-sm font-PlayfairB ml-1 text-neutral-500">
                    {barber.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Working hours */}
              <View className="items-center justify-center mr-2">
                <Text className="text-sm font-PlayfairEB text-neutral-300">
                  {barber.startTime}
                </Text>
                <View className="w-[2px] h-6 bg-[#FFD60A] my-1" />
                <Text className="text-sm font-PlayfairEB text-neutral-300">
                  {barber.endTime}
                </Text>
              </View>
            </View>

            {/* Services list */}
            <FlatList
              data={barber.services}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginTop: 16, paddingRight: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity className="rounded-sm shadow-md ml-3 w-[10rem] h-[15rem] border-2 border-[#FFD60A] overflow-hidden">
                  <ImageBackground
                    source={{ uri: item.image }}
                    resizeMode="cover"
                    className="w-full h-full justify-end"
                    imageStyle={{ borderRadius: 8 }}
                  >
                    <View className="absolute inset-0 bg-black/40 rounded-sm" />
                    <View className="p-3">
                      <Text className="text-base font-semibold text-white drop-shadow-lg">
                        {item.name}
                      </Text>
                      <Text className="text-gray-200 text-xs mt-1">
                        {item.duration} • {item.price}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

{
  /* <Text className="text-gold text-2xl font-PlayfairB mb-4">
    Stylish Barber Shop 💈
  </Text>

  <Text className="text-white text-base font-sans mb-6">
    Look sharp. Feel confident.
  </Text>

  <TouchableOpacity className="bg-gold px-6 py-3 rounded-xl shadow-gold">
    <Text className="text-dark font-bold">Book Now</Text>
  </TouchableOpacity> */
}
