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

import { images } from "@/constants/images";
import { deals } from "@/data/deals";
import { destinations } from "@/data/destinations";
import { posthog } from "@/lib/posthog";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSavedStore } from "@/store/savedStore";
import { useTripsStore } from "@/store/tripsStore";
import type { Deal } from "@/types/travel";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const SCRIM_COLORS = [
  "rgba(13,20,38,0)",
  "rgba(8,12,24,0.75)",
] as const;

const DEAL_ICON: Record<Deal["type"], keyof typeof Ionicons.glyphMap> = {
  flight: "airplane",
  hotel: "bed",
  car: "car-sport",
};

const QUICK_ACTIONS = [
  { key: "flights", label: "Flights", icon: "airplane" },
  { key: "hotels", label: "Hotels", icon: "bed" },
  { key: "cars", label: "Cars", icon: "car-sport" },
] as const;

const PAGE_GAP = 12;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { width } = useWindowDimensions();

  const [activeDeal, setActiveDeal] = useState(0);
  // Selector-only reads per the store architecture: never the whole store.
  const savedIds = useSavedStore((state) => state.savedIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);

  const cardWidth = width - 48; // matches px-lg (24px) on both sides

  const onDealsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (cardWidth + PAGE_GAP),
    );
    setActiveDeal(index);
  };

  return (
    <View
      className="flex-1 bg-cloud"
      style={{ paddingTop: insets.top + 12 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                Where are you off to today?
              </Text>
            </View>
          </View>

          <View className="w-10 h-10 items-center justify-center rounded-full bg-white">
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
          className="mx-lg mb-lg flex-row items-center gap-sm"
        >
          <View
            className="flex-1 flex-row items-center gap-sm bg-white rounded-full px-md py-md"
            style={CARD_SHADOW}
          >
            <Ionicons name="search" size={18} color="#17181F" />
            <Text className="text-body text-ink opacity-50">
              Search flights, hotels, cars…
            </Text>
          </View>
          <View className="w-11 h-11 items-center justify-center rounded-full bg-cobalt-500">
            <Ionicons name="options" size={18} color="#fff" />
          </View>
        </Pressable>

        <ScrollView
          horizontal
          pagingEnabled={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + PAGE_GAP}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onDealsScroll}
          contentContainerStyle={{ paddingHorizontal: 24, gap: PAGE_GAP }}
        >
          {deals.map((deal) => (
            <View
              key={deal.id}
              className="rounded-lg overflow-hidden"
              style={{ width: cardWidth, height: 160 }}
            >
              <Image
                source={images.onboardingMountain}
                resizeMode="cover"
                style={{ width: "100%", height: "100%", position: "absolute" }}
              />
              <LinearGradient
                colors={SCRIM_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
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
            </View>
          ))}
        </ScrollView>

        <View className="flex-row items-center justify-center gap-sm mt-sm mb-lg">
          {deals.map((deal, index) => (
            <View
              key={deal.id}
              className={`h-2 rounded-full ${
                index === activeDeal ? "w-4 bg-cobalt-500" : "w-2 bg-line"
              }`}
            />
          ))}
        </View>

        <View className="flex-row px-lg gap-sm mb-lg">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              onPress={() => router.push("/search")}
              className="flex-1 items-center bg-white rounded-lg py-md gap-sm"
              style={CARD_SHADOW}
            >
              <View className="w-12 h-12 items-center justify-center rounded-full bg-cobalt-500">
                <Ionicons name={action.icon} size={20} color="#fff" />
              </View>
              <Text className="text-[13px] font-jakarta-bold text-ink">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between px-lg mb-md">
          <Text className="text-title text-ink">Featured Destinations</Text>
          <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
            See All
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: PAGE_GAP }}
        >
          {destinations.map((destination) => {
            const isSaved = savedIds.has(destination.id);
            return (
              <View
                key={destination.id}
                className="bg-white rounded-lg overflow-hidden"
                style={[{ width: 168 }, CARD_SHADOW]}
              >
                <View style={{ width: "100%", height: 110 }}>
                  <Image
                    source={images.onboardingMountain}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View className="absolute top-2 left-2 bg-white rounded-full px-sm py-xs">
                    <Text className="text-[11px] font-jakarta-bold text-ink">
                      From {destination.priceFrom} {destination.currency}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
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
                    className="absolute top-2 right-2 w-7 h-7 items-center justify-center rounded-full bg-white"
                  >
                    <Ionicons
                      name={isSaved ? "heart" : "heart-outline"}
                      size={14}
                      color={isSaved ? "#FF6B45" : "#17181F"}
                    />
                  </Pressable>
                </View>
                <View className="p-sm">
                  <Text className="text-[14px] font-jakarta-bold text-ink">
                    {destination.city}, {destination.country}
                  </Text>
                  <Text
                    className="text-[12px] text-ink opacity-50"
                    numberOfLines={2}
                  >
                    {destination.blurb}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center justify-between px-lg mt-lg mb-md">
          <Text className="text-title text-ink">Today&apos;s Deals</Text>
          <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
            See All
          </Text>
        </View>

        <View className="px-lg gap-sm">
          {deals.map((deal) => (
            <View
              key={deal.id}
              className="flex-row items-center gap-sm bg-white rounded-lg p-md"
              style={CARD_SHADOW}
            >
              <View className="w-11 h-11 items-center justify-center rounded-full bg-cloud">
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
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
