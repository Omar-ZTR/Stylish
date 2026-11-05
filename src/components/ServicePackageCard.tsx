import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ServicePackage } from "@/src/lib/api";

interface ServicePackageCardProps {
  pack: ServicePackage;
  onPress: () => void;
  onBarberPress: () => void;
  variant?: "promotion" | "package";
  style?: StyleProp<ViewStyle>;
}

const formatPrice = (price: number) =>
  `${Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)} TND`;

export default function ServicePackageCard({
  pack,
  onPress,
  onBarberPress,
  variant = "promotion",
  style,
}: ServicePackageCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${pack.title}, ${pack.discountPercent}% off, by ${pack.barber.name}`}
      style={[styles.card, style]}
    >
      <ImageBackground
        source={{ uri: pack.imageUrl }}
        resizeMode="cover"
        imageStyle={styles.image}
        style={styles.background}
      >
        <LinearGradient
          colors={["#131009", "rgba(15, 13, 7, 0.48)", "rgba(19, 16, 8, 0.2)"]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View className="flex-1 justify-between p-4">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-[#FFBE0B] px-3 py-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#2A2312]">
                Save {pack.discountPercent}%
              </Text>
            </View>
            <View className="flex-row items-center rounded-full border border-white/35 bg-[#2A2312]/75 px-2.5 py-1">
              <MaterialIcons name="content-cut" size={13} color="#FFBE0B" />
              <Text className="ml-1.5 text-[10px] font-bold text-white">
                {pack.services.length} {pack.services.length === 1 ? "Service" : "Services"}
              </Text>
            </View>
          </View>

          <View className="max-w-[90%]">
            <Text className="text-[9px] font-bold uppercase tracking-[1.5px] text-white/35">
              {variant === "promotion" ? "FEATURED PACKAGE" : "PACKAGE DEAL"}
            </Text>
            <Text className="mt-0.5 text-lg font-bold leading-6 text-white" numberOfLines={1}>
              {pack.title}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Pressable
                onPress={onBarberPress}
                accessibilityRole="button"
                accessibilityLabel={`View ${pack.barber.name}'s profile`}
              >
                <Text className="text-[10px] font-medium text-white/80" numberOfLines={1}>
                  By {pack.barber.name}
                </Text>
              </Pressable>
              <Text className="text-[10px] font-medium text-white/80">
                {" "}· {pack.durationMinutes} min
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-white">{formatPrice(pack.finalPrice)}</Text>
            <View className="flex-row items-center rounded-full bg-[#FFBE0B] px-3.5 py-2">
              <Text className="mr-1.5 text-xs font-bold text-[#2A2312]">View Details</Text>
              <MaterialIcons name="arrow-forward" size={15} color="#2A2312" />
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 184,
    overflow: "hidden",
    borderColor: "rgba(255,190,11,0.45)",
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "#2A2312",
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  background: {
    flex: 1,
  },
  image: {
    borderRadius: 22,
  },
});
