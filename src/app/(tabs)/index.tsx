import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { DataLabel } from "@/components/dataLabel";
import { InlineError } from "@/components/loadError";
import { SkeletonTile } from "@/components/skeleton";
import { Toast } from "@/components/toast";
import { images } from "@/constants/images";
import { catalog } from "@/lib/db";
import { EXAMPLE_PROMPTS } from "@/lib/parseSearch";
import { posthog } from "@/lib/posthog";
import { submitSentence } from "@/lib/submitSentence";
import { useAsync } from "@/lib/useAsync";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSavedStore } from "@/store/savedStore";
import { useSearchStore } from "@/store/searchStore";
import { useTripsStore } from "@/store/tripsStore";
import { colors } from "@/theme/colors";
import { CARD_SHADOW } from "@/theme/shadow";
import type { Deal } from "@/types/travel";

// Header wash from the Figma frame: cobalt-100 fading into the page.
const WASH = ["rgba(220,229,253,0.9)", "rgba(241,244,249,0)"] as const;

const PAGE_GAP = 12;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  // Only flights can be searched, so only flight deals are ideas.
  const ideas = useAsync(() => catalog.fetchDeals("flight"), "ideas");
  const places = useAsync(() => catalog.fetchDestinations(), "destinations");
  const [toast, setToast] = useState<string | null>(null);

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

  // A flight deal opens Search with only its destination filled. A deal
  // with no destination opens an empty Search.
  const openDeal = (deal: Deal) => {
    resetSearch();
    if (!deal.destinationCode) {
      router.push("/search");
      return;
    }
    setSearchParams({ destination: deal.destinationCode });
    router.push({ pathname: "/search", params: { source: "deal" } });
  };

  // Saving needs an account: a guest goes to the sign in screen and nothing
  // is saved. The heart changes at once; if the save fails it goes back and
  // the toast says so.
  const onHeart = async (destinationId: string, country: string) => {
    if (!isSignedIn) {
      router.push("/onboarding");
      return;
    }
    const wasSaved = savedIds.has(destinationId);
    const ok = await toggleSaved(destinationId);
    if (!ok) {
      setToast(wasSaved ? "Couldn’t remove. Try again." : "Couldn’t save. Try again.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    posthog?.capture(
      wasSaved ? "destination_removed_from_saved" : "destination_saved",
      { destination_id: destinationId, destination_country: country },
    );
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

        {ideas.state.status === "error" ? (
          <View className="px-lg pt-md">
            <InlineError message="Couldn’t load ideas." onRetry={ideas.retry} />
          </View>
        ) : (
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
            {ideas.state.status === "loading" ? (
              <>
                <SkeletonTile />
                <SkeletonTile />
              </>
            ) : (
              ideas.state.data.map((deal) => (
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
              ))
            )}
          </ScrollView>
        )}

        <View className="flex-row items-center justify-between px-lg mt-xl mb-md">
          <Text className="text-title text-ink">Popular destinations</Text>
          <Pressable accessibilityRole="button" onPress={openSearch}>
            <Text className="text-[13px] font-jakarta-bold text-cobalt-500">
              See all
            </Text>
          </Pressable>
        </View>

        {places.state.status === "error" ? (
          <View className="px-lg">
            <InlineError message="Couldn’t load destinations." onRetry={places.retry} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: PAGE_GAP }}
          >
            {places.state.status === "loading" ? (
              <>
                <SkeletonTile width={172} />
                <SkeletonTile width={172} />
              </>
            ) : (
              places.state.data.map((destination) => {
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
                        onPress={() => onHeart(destination.id, destination.country)}
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
                        {destination.priceFrom !== null && (
                          <View className="bg-cobalt-50 rounded-full px-sm py-xs">
                            <Text className="text-[11px] font-jakarta-bold text-cobalt-700">
                              from {destination.priceFrom} {destination.currency}
                            </Text>
                          </View>
                        )}
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
              })
            )}
          </ScrollView>
        )}

        {__DEV__ && (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await AsyncStorage.clear();
              useAuthStore.getState().reset();
              useSavedStore.getState().clear();
              useTripsStore.getState().clear();
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

      {toast && (
        <View className="absolute left-lg right-lg" style={{ bottom: 16 }}>
          <Toast message={toast} />
        </View>
      )}
    </View>
  );
}
