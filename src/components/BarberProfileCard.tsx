import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { Barber } from "@/src/lib/api";

interface BarberProfileCardProps {
  barber: Barber;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
  showStartingPrice?: boolean;
}

export default function BarberProfileCard({
  barber,
  onPress,
  style,
  height = 300,
  showStartingPrice = false,
}: BarberProfileCardProps) {
  const [entrance] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));
  const specialty = barber.services[0]?.name ?? "Expert barber";
  const backgroundImage = barber.services.find((service) => service.imageUrl)?.imageUrl ?? barber.logoUrl;
  const startingPrice = Math.min(...barber.services.map((service) => service.price));

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const animatePress = (toValue: number) => {
    Animated.spring(pressScale, {
      toValue,
      speed: 28,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: entrance,
          transform: [
            { scale: pressScale },
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(0.985)}
        onPressOut={() => animatePress(1)}
        accessibilityRole="button"
        accessibilityLabel={`View ${barber.name}, ${specialty}, ${barber.location}, rated ${barber.rating.toFixed(1)} stars`}
        className="overflow-hidden rounded-[28px] border border-[#FFD60A]/35 bg-[#151719]"
        style={[styles.card, { height }]}
      >
        <ImageBackground
          source={{ uri: backgroundImage }}
          resizeMode="cover"
          className="h-full w-full"
          imageStyle={{ borderRadius: 28 }}
        >
          <LinearGradient
            colors={[
              "rgba(8,11,14,0.12)",
              "rgba(8,11,14,0.2)",
              "rgba(8,11,14,0.84)",
              "rgba(8,11,14,0.98)",
            ]}
            locations={[0, 0.32, 0.68, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View className="flex-1 justify-between p-2">
            <View className="flex-row items-start justify-between">
              <View className="mr-2 min-w-0 flex-1 flex-row items-center rounded-full bg-black/20 py-2 pl-2 pr-4"
                style={styles.borderGold}>

                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[15px] font-PlayfairB leading-5 text-white" numberOfLines={1}>
                    {barber.name}
                  </Text>
                  <Text className="mt-1 text-[11px] font-medium text-neutral-300" numberOfLines={1}>
                    {specialty}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center rounded-full border  bg-[#17150D]/90 px-3 py-2" style={styles.borderGold}>
                <MaterialIcons name="star" size={16} color="#FFD60A" />
                <Text className="ml-1.5 text-sm font-bold text-white">{barber.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View>
              <View className="mb-4 flex-row items-center">
                <View className="mr-2 flex-row items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5" style={styles.borderWhite}>
                  <MaterialIcons name="place" size={14} color="#FFD60A" />
                  <Text className="ml-1.5 max-w-[180px] text-xs font-medium text-white" numberOfLines={1}>
                    {barber.location}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-neutral-300">
                  {barber.distanceKm.toFixed(1)} km away
                </Text>
              </View>
              {/* click to booking */}
              <View className="flex-row items-center justify-between border-t border-white/15 pt-4" style={styles.borderWhite}>
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#FFD60A]">
                    Barber studio
                  </Text>
                  <Text className="mt-1 text-xs text-neutral-300" numberOfLines={1}>
                    {showStartingPrice && Number.isFinite(startingPrice)
                      ? `From ${Number.isInteger(startingPrice) ? startingPrice.toFixed(0) : startingPrice.toFixed(2)} TND · `
                      : ""}
                    Discover services and book
                  </Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFD60A] shadow-lg">
                  <MaterialIcons name="arrow-forward" size={21} color="#111111" />
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  borderGold: {
    borderColor: "#FFD60A",
  },
  borderWhite: {
    borderColor: "rgb(219, 219, 219)",
  },
  card: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
});
