import { useAuth } from "@clerk/expo";
import { useSSO } from "@clerk/expo/experimental";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { images } from "@/constants/images";

const SCRIM_COLORS = [
  "rgba(13,20,38,0)",
  "rgba(10,16,30,0.15)",
  "rgba(8,12,24,0.72)",
  "rgba(6,9,18,0.94)",
] as const;
const SCRIM_LOCATIONS = [0, 0.42, 0.68, 1] as const;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const [ssoPending, setSsoPending] = useState<"apple" | "google" | null>(null);

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/" />;

  const handleSSO = async (strategy: "oauth_apple" | "oauth_google") => {
    setSsoPending(strategy === "oauth_apple" ? "apple" : "google");
    try {
      const { createdSessionId } = await startSSOFlow({ strategy });
      if (createdSessionId) {
        router.replace("/");
      }
      // No createdSessionId means the user cancelled — do nothing.
    } catch (err) {
      console.error("SSO sign-in error:", JSON.stringify(err, null, 2));
    } finally {
      setSsoPending(null);
    }
  };

  return (
    <View className="flex-1">
      {/* NativeWind can't size a full-bleed background image (className
          leaves the underlying <img> at its intrinsic size on web), so
          this one image uses StyleSheet per AGENTS.md's style-exception
          rule instead of className. */}
      <Image
        source={images.onboardingMountain}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
      />
      <LinearGradient
        colors={SCRIM_COLORS}
        locations={SCRIM_LOCATIONS}
        style={StyleSheet.absoluteFill}
      />

      <View
        className="flex-1 justify-end px-lg"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Image
          source={images.afarIcon}
          resizeMode="contain"
          style={{ width: 44, height: 44, marginBottom: 12 }}
        />
        <Text className="text-display text-white mb-sm">
          Let&apos;s find your next adventure
        </Text>
        <Text className="text-body text-white opacity-70 mb-lg max-w-[280px]">
          Compare flights, hotels and cars in seconds — Afar learns what you
          like as you go.
        </Text>

        <View className="gap-sm">
          <Pressable
            accessibilityRole="button"
            disabled={ssoPending !== null}
            onPress={() => handleSSO("oauth_apple")}
            className="flex-row items-center justify-center gap-sm bg-black rounded-full py-md"
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            <Ionicons name="logo-apple" size={18} color="#fff" />
            <Text className="text-[14px] font-jakarta-bold text-white">
              Continue with Apple
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={ssoPending !== null}
            onPress={() => handleSSO("oauth_google")}
            className="flex-row items-center justify-center gap-sm bg-white border border-line rounded-full py-md"
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            <Ionicons name="logo-google" size={18} color="#1F1F1F" />
            <Text className="text-[14px] font-jakarta-bold text-ink">
              Continue with Google
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/email")}
            className="flex-row items-center justify-center gap-sm bg-cobalt-500 rounded-full py-md"
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            <Ionicons name="mail" size={18} color="#fff" />
            <Text className="text-[14px] font-jakarta-bold text-white">
              Continue with email
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          className="items-center mt-md"
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text className="text-[13px] font-jakarta-semibold text-white opacity-65">
            Maybe later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
