import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { languages } from "@/data/languages";
import { posthog } from "@/lib/posthog";
import { usePreferencesStore } from "@/store/preferencesStore";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const [languageOpen, setLanguageOpen] = useState(false);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;

  const currentLanguage =
    languages.find((lang) => lang.code === language) ?? languages[0];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        alignItems: "center",
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        gap: 16,
      }}
    >
      {/* className doesn't reach Image's width/height (no NativeWind
          interop for that prop on this component) — sized via style
          per AGENTS.md's style-exception rule. */}
      <Image
        source={{ uri: user?.imageUrl }}
        style={{ width: 72, height: 72, borderRadius: 36, marginTop: 16 }}
      />
      <Text className="text-title text-ink text-center">
        {user?.fullName ?? "Your account"}
      </Text>
      <Text className="text-body text-ink opacity-60 text-center">
        {user?.primaryEmailAddress?.emailAddress}
      </Text>

      <View className="w-full gap-sm mt-md">
        <Pressable
          accessibilityRole="button"
          onPress={() => setLanguageOpen((open) => !open)}
          className="w-full flex-row items-center justify-between bg-cloud rounded-lg px-md py-md"
        >
          <View className="flex-row items-center gap-sm">
            <Ionicons name="language" size={18} color="#1D4FD6" />
            <Text className="text-body text-ink">Language</Text>
          </View>
          <View className="flex-row items-center gap-xs">
            <Text className="text-body text-ink opacity-60">
              {currentLanguage.name}
            </Text>
            <Ionicons
              name={languageOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#17181F"
            />
          </View>
        </Pressable>

        {languageOpen && (
          <View
            className="w-full bg-white rounded-lg overflow-hidden border border-line"
            style={CARD_SHADOW}
          >
            {languages.map((lang, index) => (
              <Pressable
                key={lang.code}
                accessibilityRole="button"
                onPress={() => {
                  setLanguage(lang.code);
                  posthog?.capture("language_selected", {
                    language_code: lang.code,
                    language_name: lang.name,
                  });
                  setLanguageOpen(false);
                }}
                className={`flex-row items-center justify-between px-md py-md ${
                  index < languages.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <Text className="text-body text-ink">{lang.name}</Text>
                {lang.code === currentLanguage.code && (
                  <Ionicons name="checkmark" size={18} color="#1D4FD6" />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

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
    </ScrollView>
  );
}
