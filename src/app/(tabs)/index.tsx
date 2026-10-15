import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { DataLabel } from "@/components/dataLabel";
import { images } from "@/constants/images";
import { deals } from "@/data/deals";
import { destinations } from "@/data/destinations";
import { flights } from "@/data/flights";
import { EXAMPLE_PROMPTS } from "@/lib/parseSearch";
import { posthog } from "@/lib/posthog";
import { submitSentence } from "@/lib/submitSentence";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSavedStore } from "@/store/savedStore";
import { useSearchStore } from "@/store/searchStore";
import { useTripsStore } from "@/store/tripsStore";
import { colors } from "@/theme/colors";
import type { Deal } from "@/types/travel";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

// Header wash from the Figma frame: cobalt-100 fading into the page.
const WASH = ["rgba(220,229,253,0.9)", "rgba(241,244,249,0)"] as const;

const PAGE_GAP = 12;

// Only flights can be searched, so only flight deals are ideas.
const IDEAS = deals.filter((deal) => deal.type === "flight");

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  // Selector-only reads per the store architecture: never the whole store.
  const savedIds = useSavedStore((state) => state.savedIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);

  // Every way into Search clears the old search first, so old chips never
  // leak into a new one. Home never parses text itself: the sentence goes
  // through submitSentence, which Search shares.
  const resetSearch = useSearchStore((state) => state.reset);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);

  const startSearch = () => {
    resetSearch();
    router.push({ pathname: "/search", params: { focus: "1" } });
  };

  const openSearch = () => {
    resetSearch();
    router.push("/search");
  };

  const startExample = (sentence: string) => {
    submitSentence(sentence);
    router.push({ pathname: "/search", params: { q: sentence } });
  };

  // A flight deal opens Search with only its destination filled. A flight
  // that can't be found opens an empty Search.
  const openDeal = (deal: Deal) => {
    resetSearch();
    const flight = flights.find((f) => f.id === deal.refId);
    if (!flight) {
      router.push("/search");
      return;
    }
    setSearchParams({ destination: flight.destinationCode });
    router.push({ pathname: "/search", params: { source: "deal" } });
  };

  return (
    <View className="flex-1 bg-cloud">
      <LinearGradient
        colors={WASH}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View className="px-lg gap-md">
          <View className="flex-row items-center justify-between">
            {/* className doesn't reach Image's width/height, so it is sized
                via style per AGENTS.md's style-exception rule. */}
            <Image
              source={images.afarLogoMark}
              accessibilityLabel="Afar"
              style={{ width: 36, height: 36 }}
            />
            {!isSignedIn && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/onboarding")}
                hitSlop={12}
              >
                <Text className="text-body text-cobalt-500">Sign in</Text>
              </Pressable>
            )}
          </View>

          <Text className="text-display text-ink">Where to?</Text>
          <View className="h-[3px] w-12 rounded-sm bg-cobalt-500" />

          <View className="bg-white rounded-lg p-md gap-sm" style={CARD_SHADOW}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Describe your trip"
              onPress={startSearch}
              className="gap-sm"
            >
              <Text className="text-caption text-ink opacity-50">
                Describe your trip
              </Text>
              <View className="flex-row items-center gap-sm">
                <Text className="flex-1 text-body text-ink opacity-40">
                  Try “{EXAMPLE_PROMPTS[0]}”
                </Text>
                <View className="w-10 h-10 items-center justify-center rounded-full bg-cobalt-100">
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.cobalt[300]}
                  />
                </View>
              </View>
            </Pressable>
            <View className="h-px bg-line" />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/assistant")}
              className="flex-row items-center gap-sm self-start py-xs"
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={colors.cobalt[500]}
              />
              <Text className="text-[14px] font-jakarta-medium text-cobalt-500">
                Prefer to talk it through? Ask Afar
              </Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            {EXAMPLE_PROMPTS.slice(1).map((example) => (
              <Chip
                key={example}
                variant="suggestion"
                label={example}
                onPress={() => startExample(example)}
              />
            ))}
          </View>

          <Text className="text-title text-ink">Ideas to start from</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 8,
            gap: 16,
          }}
        >
          {IDEAS.map((deal) => (
            <Pressable
              key={deal.id}
              accessibilityRole="button"
              accessibilityLabel={`${deal.title}, from ${deal.price} ${deal.currency}, sample data`}
              onPress={() => openDeal(deal)}
              className="bg-white rounded-lg overflow-hidden"
              style={[{ width: 180, height: 200 }, CARD_SHADOW]}
            >
              <Image
                source={{ uri: deal.imageUrl }}
                resizeMode="cover"
                style={{ width: "100%", height: 100 }}
              />
              <View className="gap-xs" style={{ padding: PAGE_GAP }}>
                <Text className="text-body text-ink" numberOfLines={1}>
                  {deal.title}
                </Text>
                <Text className="text-[14px] font-jakarta-medium text-ink opacity-60">
                  From {deal.price} {deal.currency}
                </Text>
                <DataLabel />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row items-center justify-between px-lg mt-xl mb-md">
          <Text className="text-title text-ink">Popular destinations</Text>
          <Pressable accessibilityRole="button" onPress={openSearch}>
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
                onPress={openSearch}
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
            className="mx-lg mt-xl items-center justify-center rounded-full border border-line py-xs"
          >
            <Text className="text-[11px] font-jakarta-bold text-ink opacity-40">
              Dev: clear stored state
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
