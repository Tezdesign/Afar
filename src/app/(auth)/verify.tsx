import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyCode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const isComplete = code.length === CODE_LENGTH;

  // Clerk code verification wires up once Clerk is added — see AGENTS.md's
  // Clerk Rules. This screen is visual-only for now: completing the code
  // just reveals a success state instead of navigating anywhere.

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View
      className="flex-1 bg-white px-lg"
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
        <Text className="text-title text-ink mb-sm">Enter your code</Text>
        <Text className="text-body text-ink opacity-60 mb-lg">
          We sent a 6-digit code to{" "}
          <Text className="font-jakarta-bold">{email ?? "your email"}</Text>
        </Text>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          className="flex-row justify-between"
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const digit = code[i];
            const isActive = i === code.length && !isComplete;
            return (
              <View
                key={i}
                className={`w-[48px] h-[56px] items-center justify-center rounded-md border ${
                  isActive ? "border-cobalt-500" : "border-gray-200"
                }`}
              >
                <Text className="text-numeric text-ink">{digit ?? ""}</Text>
              </View>
            );
          })}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(text) =>
            setCode(text.replace(/\D/g, "").slice(0, CODE_LENGTH))
          }
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
          style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
        />

        {isComplete ? (
          <View className="flex-row items-center gap-sm mt-lg">
            <Ionicons name="checkmark-circle" size={20} color="#1C9A6C" />
            <Text className="text-body text-go font-jakarta-bold">
              Verified
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={handleResend}
            disabled={secondsLeft > 0}
            className="mt-lg"
          >
            <Text className="text-[13px] text-ink opacity-60 text-center">
              Didn&apos;t get a code?{" "}
              {secondsLeft > 0 ? (
                <Text>Resend in 0:{String(secondsLeft).padStart(2, "0")}</Text>
              ) : (
                <Text className="text-cobalt-500 font-jakarta-bold">
                  Resend code
                </Text>
              )}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
