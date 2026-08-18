import { useSignIn, useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { clerkErrorMessage } from "@/lib/clerk";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyCode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email, mode } = useLocalSearchParams<{
    email?: string;
    mode?: "sign-in" | "sign-up";
  }>();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isComplete = code.length === CODE_LENGTH;

  useEffect(() => {
    // errorMessage is included so a failed attempt doesn't immediately
    // retry itself — isVerifying resets to false on failure, but the same
    // (already-wrong) code is still sitting in `code`/isComplete, which
    // would otherwise re-fire this effect in a tight loop.
    if (!isComplete || isVerifying || isVerified || errorMessage) return;

    const verify = async () => {
      setIsVerifying(true);
      setErrorMessage(null);

      try {
        // TODO: once the real home screen exists, navigate there instead
        // (router.replace("/")) — for now just confirm the session is live.
        const navigate = async ({ session }: { session: { currentTask?: unknown } }) => {
          if (session?.currentTask) return;
          Alert.alert("You're all set!", "Your account is verified.");
        };

        if (mode === "sign-up") {
          const { error } = await signUp.verifications.verifyEmailCode({ code });
          if (error) {
            setErrorMessage(clerkErrorMessage(error));
            return;
          }
          if (signUp.status === "complete") {
            setIsVerified(true);
            await signUp.finalize({ navigate });
          }
        } else {
          const { error } = await signIn.emailCode.verifyCode({ code });
          if (error) {
            setErrorMessage(clerkErrorMessage(error));
            return;
          }
          if (signIn.status === "complete") {
            setIsVerified(true);
            await signIn.finalize({ navigate });
          }
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [isComplete, isVerifying, isVerified, errorMessage, code, mode, signIn, signUp, router]);

  const handleResend = async () => {
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

    if (mode === "sign-up") {
      await signUp.verifications.sendEmailCode();
    } else {
      await signIn.emailCode.sendCode();
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setCode("");
    inputRef.current?.focus();
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
                  errorMessage
                    ? "border-red-500"
                    : isActive
                      ? "border-cobalt-500"
                      : "border-line"
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
          onChangeText={(text) => {
            setCode(text.replace(/\D/g, "").slice(0, CODE_LENGTH));
            setErrorMessage(null);
          }}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
          style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
        />

        {errorMessage ? (
          <View className="mt-lg">
            <Text className="text-[13px] text-red-500 mb-sm">
              {errorMessage}
            </Text>
            <Pressable accessibilityRole="button" onPress={handleRetry}>
              <Text className="text-[13px] text-cobalt-500 font-jakarta-bold">
                Try again
              </Text>
            </Pressable>
          </View>
        ) : isVerified ? (
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
            disabled={secondsLeft > 0 || isVerifying}
            className="mt-lg"
          >
            <Text className="text-[13px] text-ink opacity-60 text-center">
              {isVerifying ? (
                "Verifying…"
              ) : (
                <>
                  Didn&apos;t get a code?{" "}
                  {secondsLeft > 0 ? (
                    <Text>
                      Resend in 0:{String(secondsLeft).padStart(2, "0")}
                    </Text>
                  ) : (
                    <Text className="text-cobalt-500 font-jakarta-bold">
                      Resend code
                    </Text>
                  )}
                </>
              )}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
