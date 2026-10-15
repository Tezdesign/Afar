import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { Image, Text, View } from "react-native";

import { images } from "@/constants/images";
import { LoadError } from "@/components/loadError";
import { posthog } from "@/lib/posthog";
import { useStreamVideoClient } from "@/lib/stream";
import { useAirportStore } from "@/store/airportStore";
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

// Points authStore at the given account's own AsyncStorage bucket ("guest"
// while signed out) and loads whatever was saved there before. Saved and
// trips are not here: they live in Supabase and load after sign in.
function applyStorageScope(scope: string) {
  useAuthStore.persist.setOptions({ name: `auth-store:${scope}` });
  useAuthStore.persist.rehydrate();
}

// Saved and trips used to be stored on the device, one bucket per account.
// They live in Supabase now, so the old buckets are dropped on purpose. Safe
// to run on every start: once they are gone there is nothing left to remove.
async function removeLegacyDeviceKeys() {
  const keys = await AsyncStorage.getAllKeys();
  const old = keys.filter(
    (key) => key.startsWith("saved-store:") || key.startsWith("trips-store:"),
  );
  if (old.length > 0) await AsyncStorage.multiRemove(old);
}

// Runs side effects tied to the Clerk sign-in/sign-out transition: swaps
// the local store to the right account's storage scope, loads or clears the
// account's saved and trips, and keeps PostHog's identified user in sync.
function SessionEffects() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const preferredLanguage = usePreferencesStore((state) => state.language);
  const identifiedUserId = useRef<string | null>(null);
  const lastIdentifiedLanguage = useRef<string | null>(null);
  const activeScope = useRef<string | null>(null);

  useEffect(() => {
    removeLegacyDeviceKeys().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const scope = isSignedIn && user ? user.id : "guest";
    if (activeScope.current !== scope) {
      activeScope.current = scope;
      applyStorageScope(scope);

      // Clearing first ends the previous session's writes, so nothing from
      // it can land in this account or change what this person sees.
      useSavedStore.getState().clear();
      useTripsStore.getState().clear();
      if (scope !== "guest") {
        useSavedStore.getState().load();
        useTripsStore.getState().load();
      }
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
  const airportStatus = useAirportStore((state) => state.status);
  const loadAirports = useAirportStore((state) => state.load);

  // The airports feed the chips, the pickers and the sentence parser, so
  // nothing renders until they are in. Starts once Clerk is ready so the
  // request carries the right session.
  useEffect(() => {
    if (isLoaded) loadAirports();
  }, [isLoaded, loadAirports]);

  // Splash: while Clerk restores the session and the airports load. Lives
  // here (not a route) since both (auth) and (tabs) need Clerk to be loaded
  // before their own guards can decide where to send the user.
  if (airportStatus === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-xl bg-white px-lg">
        <Image
          source={images.afarLogo}
          resizeMode="contain"
          style={{ width: 220, height: 79 }}
        />
        <View className="w-full">
          <LoadError title="Can’t reach Afar" onRetry={loadAirports} />
        </View>
      </View>
    );
  }

  if (!isLoaded || airportStatus !== "ready") {
    return (
      <View className="flex-1 items-center justify-center gap-xl bg-white">
        <Image
          source={images.afarLogo}
          resizeMode="contain"
          style={{ width: 220, height: 79 }}
        />
        {isLoaded && (
          <Text className="text-caption text-ink opacity-50">
            Getting things ready
          </Text>
        )}
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
