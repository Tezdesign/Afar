import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadError } from "@/components/loadError";
import { SkeletonRow } from "@/components/skeleton";
import { images } from "@/constants/images";
import { catalog } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";
import { useSavedStore } from "@/store/savedStore";

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  // Selector-only read — this screen only re-renders when savedIds changes.
  const savedIds = useSavedStore((state) => state.savedIds);
  const savedStatus = useSavedStore((state) => state.status);
  const loadSaved = useSavedStore((state) => state.load);
  const places = useAsync(() => catalog.fetchDestinations(), "destinations");

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;

  // The list itself (which ids) comes from the account, the cards from the catalog.
  const failed = savedStatus === "error" || places.state.status === "error";
  const loading =
    savedStatus === "loading" || (!failed && places.state.status === "loading");

  if (failed || loading) {
    return (
      <View
        className="flex-1 bg-white px-lg gap-md"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-display text-ink">Saved</Text>
        {failed ? (
          <LoadError
            title="Couldn’t load your saved places"
            onRetry={() => {
              if (savedStatus === "error") loadSaved();
              places.retry();
            }}
          />
        ) : (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
      </View>
    );
  }

  const savedDestinations =
    places.state.status === "ready"
      ? places.state.data.filter((destination) => savedIds.has(destination.id))
      : [];

  if (savedDestinations.length === 0) {
    return (
      <View
        className="flex-1 bg-white items-center justify-center px-lg gap-sm"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Ionicons name="heart-outline" size={40} color="#1D4FD6" />
        <Text className="text-title text-ink text-center">Nothing saved yet</Text>
        <Text className="text-body text-ink opacity-60 text-center">
          Tap the heart on a destination to save it for later.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Text className="text-display text-ink px-lg mb-lg">Saved</Text>
      <View className="px-lg gap-sm">
        {savedDestinations.map((destination) => (
          <View
            key={destination.id}
            className="flex-row bg-white rounded-lg overflow-hidden border border-line"
          >
            <Image
              source={images.onboardingMountain}
              resizeMode="cover"
              style={{ width: 96, height: 96 }}
            />
            <View className="flex-1 p-sm justify-center">
              <Text className="text-[14px] font-jakarta-bold text-ink">
                {destination.city}, {destination.country}
              </Text>
              <Text className="text-[12px] text-ink opacity-50">
                {destination.priceFrom !== null
                  ? `From ${destination.priceFrom} ${destination.currency}`
                  : "No flights yet"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
