import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { destinations } from "@/data/destinations";
import { useSavedStore } from "@/store/savedStore";

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  // Selector-only read — this screen only re-renders when savedIds changes.
  const savedIds = useSavedStore((state) => state.savedIds);
  const savedDestinations = destinations.filter((destination) =>
    savedIds.has(destination.id),
  );

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;

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
                From {destination.priceFrom} {destination.currency}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
