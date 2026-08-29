import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { PostHogErrorBoundary, PostHogProvider } from "posthog-react-native";
import "../global.css";

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Image, View } from "react-native";

import { images } from "@/constants/images";
import { posthog } from "@/lib/posthog";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.");
}

SplashScreen.preventAutoHideAsync();

function PostHogErrorFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Image
        source={images.afarLogo}
        resizeMode="contain"
        style={{ width: 220, height: 79 }}
      />
    </View>
  );
}

function UserIdentification() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog || !isLoaded) return;

    if (!isSignedIn) {
      if (identifiedUserId.current) {
        posthog.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (!user || identifiedUserId.current === user.id) return;

    posthog.identify(user.id, {
      $set: {
        ...(user.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : {}),
        ...(user.fullName ? { name: user.fullName } : {}),
      },
    });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, user]);

  return null;
}

function AppGate() {
  const { isLoaded } = useAuth();

  // Splash — shown while Clerk restores the session from the token cache.
  // Lives here (not a route) since both (auth) and (tabs) need Clerk to be
  // loaded before their own guards can decide where to send the user.
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const app = <AppGate />;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog}>
          <UserIdentification />
          <PostHogErrorBoundary fallback={PostHogErrorFallback}>
            {app}
          </PostHogErrorBoundary>
        </PostHogProvider>
      ) : (
        app
      )}
    </ClerkProvider>
  );
}
