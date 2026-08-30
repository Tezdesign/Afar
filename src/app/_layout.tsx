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
import { StreamVideo } from "@stream-io/video-react-native-sdk";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ReactNode, useEffect, useRef } from "react";
import { Image, View } from "react-native";

import { images } from "@/constants/images";
import { posthog } from "@/lib/posthog";
import { useStreamVideoClient } from "@/lib/stream";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSavedStore } from "@/store/savedStore";
import { useTripsStore } from "@/store/tripsStore";

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

// Points authStore/savedStore/tripsStore at the given account's own
// AsyncStorage bucket ("guest" while signed out) and loads whatever was
// saved there before. This is how a saved deal survives that same
// account's logout+login, while a different account on the same device
// never sees it — each scope is its own bucket, nothing is shared.
function applyStorageScope(scope: string) {
  useAuthStore.persist.setOptions({ name: `auth-store:${scope}` });
  useSavedStore.persist.setOptions({ name: `saved-store:${scope}` });
  useTripsStore.persist.setOptions({ name: `trips-store:${scope}` });

  useAuthStore.persist.rehydrate();
  useSavedStore.persist.rehydrate();
  useTripsStore.persist.rehydrate();
}

// Runs side effects tied to the Clerk sign-in/sign-out transition: swaps
// the local stores to the right account's storage scope, and keeps
// PostHog's identified user in sync.
function SessionEffects() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const preferredLanguage = usePreferencesStore((state) => state.language);
  const identifiedUserId = useRef<string | null>(null);
  const lastIdentifiedLanguage = useRef<string | null>(null);
  const activeScope = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const scope = isSignedIn && user ? user.id : "guest";
    if (activeScope.current !== scope) {
      activeScope.current = scope;
      applyStorageScope(scope);
    }

    if (!isSignedIn) {
      if (identifiedUserId.current) {
        posthog?.reset();
        identifiedUserId.current = null;
        lastIdentifiedLanguage.current = null;
      }
      return;
    }

    if (!user) return;

    // Re-identify on sign-in (new user id) and again any time
    // preferred_language changes mid-session — not on every render.
    const isNewUser = identifiedUserId.current !== user.id;
    const languageChanged = lastIdentifiedLanguage.current !== preferredLanguage;
    if (!isNewUser && !languageChanged) return;

    posthog?.identify(user.id, {
      $set: {
        ...(user.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : {}),
        ...(user.fullName ? { name: user.fullName } : {}),
        preferred_language: preferredLanguage,
      },
      // PostHog only records $set_once the first time it sees this
      // property for a person — harmless to send on every identify call.
      $set_once: { signup_date: new Date().toISOString() },
    });
    identifiedUserId.current = user.id;
    lastIdentifiedLanguage.current = preferredLanguage;
  }, [isLoaded, isSignedIn, user, preferredLanguage]);

  return null;
}

// Mounted once, above the router, so the Stream Video client (and any
// active call) survives screen transitions — see RULES.md > Navigation and
// overlay discipline. Renders children plain (no video context) while
// signed out or still connecting; the assistant screen's mic button is the
// only thing that actually starts a call.
function StreamVideoRoot({ children }: { children: ReactNode }) {
  const client = useStreamVideoClient();
  if (!client) return <>{children}</>;
  return <StreamVideo client={client}>{children}</StreamVideo>;
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

  const app = (
    <StreamVideoRoot>
      <AppGate />
    </StreamVideoRoot>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SessionEffects />
      {posthog ? (
        <PostHogProvider client={posthog}>
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
