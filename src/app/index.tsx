import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { Image, View } from "react-native";

import { images } from "@/constants/images";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

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

  return <Redirect href={isSignedIn ? "/search" : "/onboarding"} />;
}
