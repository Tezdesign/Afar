import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deals } from "@/data/deals";
import { destinations } from "@/data/destinations";
import { posthog } from "@/lib/posthog";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSavedStore } from "@/store/savedStore";
import { useTripsStore } from "@/store/tripsStore";
import type { DealType } from "@/types/travel";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const SCRIM_COLORS = [
  "rgba(13,20,38,0)",
  "rgba(8,12,24,0.78)",
] as const;

const DEAL_ICON: Record<DealType, keyof typeof Ionicons.glyphMap> = {
  flight: "airplane",
  hotel: "bed",
  car: "car-sport",
};

// Segmented mode switch. Keys are DealType values so filtering the feed
// is a direct `deal.type === mode` check.
const MODES = [
  { key: "flight", label: "Flights", heading: "Flight deals", icon: "airplane" },
  { key: "hotel", label: "Hotels", heading: "Hotel deals", icon: "bed" },
  { key: "car", label: "Cars", heading: "Car deals", icon: "car-sport" },
] as const satisfies readonly {
  key: DealType;
  label: string;
  heading: string;
  icon: keyof typeof Ionicons.glyphMap;
}[];

const PAGE_GAP = 12;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<DealType>("flight");
  const [activeDeal, setActiveDeal] = useState(0);
  // Selector-only reads per the store architecture: never the whole store.
  const savedIds = useSavedStore((state) => state.savedIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);

  const activeMode = MODES.find((m) => m.key === mode) ?? MODES[0];
  // Hero carousel = every deal for the active mode. "Trending now" = the
  // non-featured deals from the *other* modes, so nothing shows twice and
  // the list doubles as a cross-category nudge (booked a flight? here's a
  // hotel).
  const modeDeals = deals.filter((deal) => deal.type === mode);
  const trendingDeals = deals.filter(
    (deal) => deal.type !== mode && !deal.featured,
  );

  const cardWidth = width - 48; // matches px-lg (24px) on both sides

  const onDealsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (cardWidth + PAGE_GAP),
    );
    setActiveDeal(index);
  };

  const switchMode = (next: DealType) => {
    setMode(next);
    setActiveDeal(0);
  };

  return (
    <View
      className="flex-1 bg-cloud"
      style={{ paddingTop: insets.top + 12 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="px-lg flex-row items-center justify-between mb-lg">
          <View className="flex-row items-center gap-sm flex-1">
            {/* className doesn't reach Image's width/height (no NativeWind
                interop for that prop on this component) — sized via style
                per AGENTS.md's style-exception rule. */}
            <Image
              source={{ uri: user?.imageUrl }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
            <View className="flex-1">
              <Text className="text-title text-ink">
                Hello, {user?.firstName ?? "there"}
              </Text>
              <Text className="text-body text-ink opacity-60">
                Where to next?
              </Text>
            </View>
          </View>

          <View
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={CARD_SHADOW}
          >
            <Ionicons name="notifications" size={18} color="#17181F" />
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ember-500" />
          </View>
        </View>

        {__DEV__ && (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await AsyncStorage.clear();
              useAuthStore.getState().reset();
              useSavedStore.getState().clearSaved();
              useTripsStore.getState().clearTrips();
              usePreferencesStore.setState({ language: "en", currency: "USD" });
            }}
            className="mx-lg mb-sm items-center justify-center rounded-full border border-line py-xs"
          >
            <Text className="text-[11px] font-jakarta-bold text-ink opacity-40">
              Dev: clear stored state
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/search")}
          className="mx-lg mb-md flex-row items-center gap-sm"
        >
          <View
            className="flex-1 flex-row items-center gap-sm bg-white rounded-full px-md py-md"
            style={CARD_SHADOW}
          >
            <Ionicons name="search" size={18} color="#17181F" />
            <Text className="text-body text-ink opacity-50">
              Search {activeMode.label.toLowerCase()}…
            </Text>
          </View>
          <View className="w-11 h-11 items-center justify-center rounded-full bg-cobalt-500">
            <Ionicons name="options" size={18} color="#fff" />
          </View>
        </Pressable>

        {/* Segmented mode switch — solid-filled active pill on a white
            track, the house pattern for category switching. */}
        <View
          className="mx-lg mb-lg flex-row bg-white rounded-full p-xs"
          style={CARD_SHADOW}
        >
          {MODES.map((m) => {
            const active = m.key === mode;
            return (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => switchMode(m.key)}
                className={`flex-1 flex-row items-center justify-center gap-xs py-sm rounded-full ${
                  active ? "bg-cobalt-500" : ""
                }`}
              >
                <Ionicons
                  name={m.icon}
                  size={16}
                  color={active ? "#fff" : "#17181F"}
                />
                <Text
                  className={`text-[13px] font-jakarta-bold ${
                    active ? "text-white" : "text-ink opacity-55"
                  }`}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between px-lg mb-md">
          <Text className="text-title text-ink">{activeMode.heading}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/search")}
          >
            <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
              See all
            </Text>
          </Pressable>
        </View>

        {/* key={mode} remounts the rail so it snaps back to the first card
            whenever the mode changes. */}
        <ScrollView
          key={mode}
          horizontal
          decelerationRate="fast"
          snapToInterval={cardWidth + PAGE_GAP}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onDealsScroll}
          contentContainerStyle={{ paddingHorizontal: 24, gap: PAGE_GAP }}
        >
          {modeDeals.map((deal) => (
            <Pressable
              key={deal.id}
              accessibilityRole="button"
              onPress={() => router.push("/search")}
              className="rounded-lg overflow-hidden"
              style={[{ width: cardWidth, height: 188 }, CARD_SHADOW]}
            >
              <Image
                source={{ uri: deal.imageUrl }}
                resizeMode="cover"
                style={{ width: "100%", height: "100%", position: "absolute" }}
              />
              <LinearGradient
                colors={SCRIM_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.7 }}
                style={{ flex: 1, padding: 16, justifyContent: "space-between" }}
              >
                {deal.discountPercent ? (
                  <View className="self-start bg-ember-500 rounded-full px-sm py-xs">
                    <Text className="text-[11px] font-jakarta-bold text-white">
                      -{deal.discountPercent}%
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                <View>
                  <Text className="text-title text-white">{deal.title}</Text>
                  <Text className="text-body text-white opacity-80 mb-sm">
                    {deal.subtitle}
                  </Text>
                  <View className="self-start bg-white rounded-full px-md py-sm">
                    <Text className="text-[13px] font-jakarta-bold text-ink">
                      From {deal.price} {deal.currency}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>

        {modeDeals.length > 1 && (
          <View className="flex-row items-center justify-center gap-sm mt-sm mb-lg">
            {modeDeals.map((deal, index) => (
              <View
                key={deal.id}
                className={`h-2 rounded-full ${
                  index === activeDeal ? "w-4 bg-cobalt-500" : "w-2 bg-line"
                }`}
              />
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between px-lg mt-lg mb-md">
          <Text className="text-title text-ink">Popular destinations</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/search")}
          >
            <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
              See all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: PAGE_GAP }}
        >
          {destinations.map((destination) => {
            const isSaved = savedIds.has(destination.id);
            return (
              <Pressable
                key={destination.id}
                accessibilityRole="button"
                onPress={() => router.push("/search")}
                className="bg-white rounded-md overflow-hidden"
                style={[{ width: 172 }, CARD_SHADOW]}
              >
                <View style={{ width: "100%", height: 112 }}>
                  <Image
                    source={{ uri: destination.imageUrl }}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSaved ? "Remove from saved" : "Save destination"
                    }
                    onPress={() => {
                      const action = isSaved
                        ? "destination_removed_from_saved"
                        : "destination_saved";
                      toggleSaved(destination.id);
                      posthog?.capture(action, {
                        destination_id: destination.id,
                        destination_country: destination.country,
                      });
                    }}
                    className="absolute top-2 right-2 w-8 h-8 items-center justify-center rounded-full bg-white"
                  >
                    <Ionicons
                      name={isSaved ? "heart" : "heart-outline"}
                      size={14}
                      color={isSaved ? "#FF6B45" : "#17181F"}
                    />
                  </Pressable>
                </View>
                <View className="p-sm gap-xs">
                  <Text
                    className="text-[14px] font-jakarta-bold text-ink"
                    numberOfLines={1}
                  >
                    {destination.city}, {destination.country}
                  </Text>
                  <View className="flex-row items-center gap-xs">
                    <View className="bg-cobalt-50 rounded-full px-sm py-xs">
                      <Text className="text-[11px] font-jakarta-bold text-cobalt-700">
                        from {destination.priceFrom} {destination.currency}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-xs">
                      <Ionicons name="star" size={11} color="#FF6B45" />
                      <Text className="text-[11px] font-jakarta-bold text-ink opacity-70">
                        {destination.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center justify-between px-lg mt-lg mb-md">
          <Text className="text-title text-ink">Trending now</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/search")}
          >
            <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
              See all
            </Text>
          </Pressable>
        </View>

        <View className="px-lg gap-sm">
          {trendingDeals.map((deal) => (
            <Pressable
              key={deal.id}
              accessibilityRole="button"
              onPress={() => router.push("/search")}
              className="flex-row items-center gap-sm bg-white rounded-md p-md"
              style={CARD_SHADOW}
            >
              <View className="w-11 h-11 items-center justify-center rounded-full bg-cobalt-50">
                <Ionicons name={DEAL_ICON[deal.type]} size={18} color="#1D4FD6" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-jakarta-bold text-ink">
                  {deal.title}
                </Text>
                <Text className="text-[12px] text-ink opacity-50">
                  {deal.subtitle}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[14px] font-jakarta-bold text-ink">
                  {deal.price} {deal.currency}
                </Text>
                {deal.discountPercent ? (
                  <Text className="text-[11px] text-go font-jakarta-bold">
                    -{deal.discountPercent}%
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
