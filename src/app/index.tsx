import { useAuth, useUser } from "@clerk/expo";
import { Redirect } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

import { images } from "@/constants/images";

export default function Index() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  // Splash — shown while Clerk restores the session from the token cache.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Image
          source={images.afarLogo}
          resizeMode="contain"
          style={{ width: 220, height: 79 }}
        />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  // Minimal home stub — proves sign-in works and survives a restart.
  // The real home screen is a separate, later task.
  return (
    <View className="flex-1 items-center justify-center bg-white px-lg gap-md">
      <Image
        source={images.afarIcon}
        resizeMode="contain"
        style={{ width: 56, height: 56 }}
      />
      <Text className="text-title text-ink text-center">
        Signed in as{"\n"}
        {user?.primaryEmailAddress?.emailAddress ?? "your account"}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => signOut()}
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
