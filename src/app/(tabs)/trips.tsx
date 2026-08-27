import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Trips() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;

  return (
    <View
      className="flex-1 bg-white items-center justify-center px-lg gap-sm"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Ionicons name="briefcase-outline" size={40} color="#1D4FD6" />
      <Text className="text-title text-ink text-center">
        No trips booked yet
      </Text>
      <Text className="text-body text-ink opacity-60 text-center">
        Once you book a flight, hotel or car, it&apos;ll show up here.
      </Text>
    </View>
  );
}
