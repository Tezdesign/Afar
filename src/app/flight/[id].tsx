import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { airports } from "@/data/airports";
import { flights } from "@/data/flights";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatDuration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const formatStops = (stops: number) =>
  stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`;

export default function FlightInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const flight = flights.find((f) => f.id === id);
  const origin = airports.find((a) => a.code === flight?.originCode);
  const destination = airports.find((a) => a.code === flight?.destinationCode);

  if (!flight || !origin || !destination) {
    return (
      <View
        className="flex-1 bg-white items-center justify-center px-lg gap-sm"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Ionicons name="airplane" size={40} color="#1D4FD6" />
        <Text className="text-title text-ink text-center">
          Flight not found
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text className="text-[13px] text-cobalt-500 font-jakarta-bold">
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cloud" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="px-lg">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={20} color="#17181F" />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-display text-ink mt-lg">
              {origin.city} → {destination.city}
            </Text>
            <Text className="text-body text-ink opacity-60 mt-xs">
              {formatDate(flight.departDate)}
              {flight.returnDate
                ? ` – ${formatDate(flight.returnDate)} · Round trip`
                : " · One-way"}
            </Text>

            {flight.dealBadge && (
              <View className="self-start bg-ember-500 rounded-full px-sm py-xs mt-sm">
                <Text className="text-[11px] font-jakarta-bold text-white">
                  {flight.dealBadge}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* One cohesive block, sections separated by hairlines instead of
              stacking separate shadow cards — avoids the generic
              card-on-card-on-card look. */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(80)}
            className="mt-xl"
          >
            <View className="flex-row items-center gap-sm pb-md border-b border-line">
              <View className="w-11 h-11 items-center justify-center rounded-full bg-cobalt-50">
                <Ionicons name="airplane" size={18} color="#1D4FD6" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-jakarta-bold text-ink">
                  {flight.airline}
                </Text>
                <Text className="text-[13px] text-ink opacity-50">
                  {formatDuration(flight.durationMinutes)}
                </Text>
              </View>
              <View
                className={`rounded-full px-sm py-xs ${
                  flight.stops === 0 ? "bg-cobalt-50" : "bg-cloud"
                }`}
              >
                <Text
                  className={`text-[11px] font-jakarta-bold ${
                    flight.stops === 0
                      ? "text-cobalt-700"
                      : "text-ink opacity-60"
                  }`}
                >
                  {formatStops(flight.stops)}
                </Text>
              </View>
            </View>

            {/* Flight-path motif: filled dot (origin) — line — outline dot
                (destination), stretched to match the From/To column height. */}
            <View className="flex-row py-md border-b border-line">
              <View className="items-center mr-sm" style={{ width: 12 }}>
                <View className="w-[10px] h-[10px] rounded-full bg-cobalt-500" />
                <View className="flex-1 w-[1.5px] bg-line my-xs" />
                <View className="w-[10px] h-[10px] rounded-full border-2 border-cobalt-500 bg-white" />
              </View>
              <View className="flex-1 justify-between" style={{ gap: 24 }}>
                <View>
                  <Text className="text-caption text-ink opacity-50">
                    From
                  </Text>
                  <Text className="text-body text-ink">
                    {origin.city}, {origin.country} ({origin.code})
                  </Text>
                </View>
                <View>
                  <Text className="text-caption text-ink opacity-50">To</Text>
                  <Text className="text-body text-ink">
                    {destination.city}, {destination.country} (
                    {destination.code})
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-md">
              <Text className="text-[13px] text-ink opacity-50">
                Total price
              </Text>
              <View className="items-end">
                {flight.previousPrice && (
                  <Text className="text-[13px] text-ink opacity-40 line-through">
                    {flight.previousPrice} {flight.currency}
                  </Text>
                )}
                <Text className="text-numeric text-ink">
                  {flight.price} {flight.currency}
                </Text>
                <Text className="text-[12px] text-ink opacity-50">
                  per person
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View
        className="px-lg bg-white border-t border-line"
        style={[{ paddingTop: 16, paddingBottom: insets.bottom + 16 }, CARD_SHADOW]}
      >
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-sm rounded-full bg-cobalt-500 py-md"
          style={({ pressed }) =>
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
          }
        >
          <Text className="text-[14px] font-jakarta-bold text-white">
            Select flight · {flight.price} {flight.currency}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
