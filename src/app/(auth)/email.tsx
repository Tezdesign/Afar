import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const isValid = EMAIL_PATTERN.test(email.trim());

  // Clerk email sign-in wires up once Clerk is added — see AGENTS.md's
  // Clerk Rules. This screen is visual-only for now.

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <View
        className="flex-1 px-lg"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full bg-cloud"
        >
          <Ionicons name="chevron-back" size={20} color="#17181F" />
        </Pressable>

        <View className="mt-xl">
          <Text className="text-title text-ink mb-sm">
            What&apos;s your email?
          </Text>
          <Text className="text-body text-ink opacity-60 mb-lg">
            We&apos;ll send a code to confirm it&apos;s you.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8A8D9A"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            className="border border-gray-200 rounded-lg px-md py-md text-body text-ink"
          />
        </View>

        <View className="flex-1" />

        <Pressable
          accessibilityRole="button"
          disabled={!isValid}
          onPress={() =>
            router.push({ pathname: "/verify", params: { email } })
          }
          className={`items-center justify-center rounded-full py-md ${
            isValid ? "bg-cobalt-500" : "bg-cobalt-100"
          }`}
          style={({ pressed }) => pressed && isValid && { opacity: 0.85 }}
        >
          <Text
            className={`text-[14px] font-jakarta-bold ${
              isValid ? "text-white" : "text-cobalt-300"
            }`}
          >
            Continue
          </Text>
        </Pressable>

        <Text className="text-[12px] text-ink opacity-40 text-center mt-md">
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
