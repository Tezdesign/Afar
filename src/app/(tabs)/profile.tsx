import { useAuth, useUser } from "@clerk/expo";
import { Redirect } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { posthog } from "@/lib/posthog";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;

  return (
    <View
      className="flex-1 bg-white items-center justify-center px-lg gap-md"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* className doesn't reach Image's width/height (no NativeWind
          interop for that prop on this component) — sized via style
          per AGENTS.md's style-exception rule. */}
      <Image
        source={{ uri: user?.imageUrl }}
        style={{ width: 72, height: 72, borderRadius: 36 }}
      />
      <Text className="text-title text-ink text-center">
        {user?.fullName ?? "Your account"}
      </Text>
      <Text className="text-body text-ink opacity-60 text-center">
        {user?.primaryEmailAddress?.emailAddress}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          posthog?.capture("sign_out_initiated");
          signOut();
        }}
        className="bg-cobalt-500 rounded-full py-md px-lg mt-md"
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Text className="text-[14px] font-jakarta-bold text-white">
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}
