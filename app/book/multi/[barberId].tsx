import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import "../../global.css";

type RouteParams = {
  barberId?: string | string[];
  services?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function MultiBooking() {
  const params = useLocalSearchParams<RouteParams>();
  const router = useRouter();
  const barberId = firstParam(params.barberId);
  const serviceIds = (firstParam(params.services) ?? "").split(",").filter(Boolean);

  if (barberId && serviceIds.length) {
    return (
      <Redirect
        href={{
          pathname: "/book/[barberId]/[serviceId]",
          params: {
            barberId,
            serviceId: serviceIds[0],
            services: serviceIds.join(","),
          },
        }}
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-[#111111] px-8">
      <Text className="text-center text-lg font-PlayfairB text-white">Choose a service first</Text>
      <Text className="mt-2 text-center text-sm text-neutral-400">
        Return to the barber profile and select at least one service to book.
      </Text>
      <TouchableOpacity onPress={() => router.back()} className="mt-6 rounded-full bg-[#FFBE0B] px-6 py-3">
        <Text className="font-bold text-[#17130A]">Go back</Text>
      </TouchableOpacity>
    </View>
  );
}
