import { useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { clerkErrorMessage } from "@/lib/clerk";
import { posthog } from "@/lib/posthog";

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
  const { isSignedIn } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isComplete = code.length === CODE_LENGTH;

  // Tracks the exact code string already submitted, so a successful call
  // that doesn't fully complete the sign-up/sign-in (e.g. the instance
  // still needs a password) can't be resubmitted in a loop — relying on
  // isVerifying/isVerified alone isn't enough, since neither flips true
  // in that case.
  const attemptedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isComplete || isVerifying || isVerified) return;
    if (attemptedCodeRef.current === code) return;

    const verify = async () => {
      attemptedCodeRef.current = code;
      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const navigate = async ({ session }: { session: { currentTask?: unknown } }) => {
          if (session?.currentTask) return;
          router.replace("/");
        };

        if (mode === "sign-up") {
          const { error } = await signUp.verifications.verifyEmailCode({ code });
          if (error) {
            setErrorMessage(clerkErrorMessage(error));
            return;
          }
          if (signUp.status === "complete") {
            posthog?.capture("email_auth_completed", { auth_mode: "sign_up" });
            setIsVerified(true);
            await signUp.finalize({ navigate });
          } else {
            setErrorMessage(
              `Email verified, but sign-up still needs: ${signUp.missingFields.join(", ") || "additional info"}.`,
            );
          }
        } else {
          const { error } = await signIn.emailCode.verifyCode({ code });
          if (error) {
            setErrorMessage(clerkErrorMessage(error));
            return;
          }
          if (signIn.status === "complete") {
            posthog?.capture("email_auth_completed", { auth_mode: "sign_in" });
            setIsVerified(true);
            await signIn.finalize({ navigate });
          } else {
            setErrorMessage(`Almost there — this account needs an extra step (${signIn.status}).`);
          }
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [
    isComplete,
    isVerifying,
    isVerified,
    code,
    mode,
    signIn,
    signUp,
    router,
  ]);

  // A previous attempt may have actually completed server-side (e.g. it
  // crashed after finalize() created the session but before navigating
  // away) — in that case the underlying signIn/signUp resource is stuck
  // "complete" and no code will ever verify again. If we're already
  // signed in, there's nothing left to do here.
  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    attemptedCodeRef.current = null;
    setCode("");
    setErrorMessage(null);
    inputRef.current?.focus();
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

    const { error } =
      mode === "sign-up"
        ? await signUp.verifications.sendEmailCode()
        : await signIn.emailCode.sendCode();

    if (error) {
      console.log("[verify] resend error:", JSON.stringify(error, null, 2));
      setErrorMessage(clerkErrorMessage(error));
    }
  };

  const handleRetry = () => {
    attemptedCodeRef.current = null;
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
            <View className="flex-row gap-lg">
              <Pressable accessibilityRole="button" onPress={handleRetry}>
                <Text className="text-[13px] text-cobalt-500 font-jakarta-bold">
                  Try again
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleResend}
                disabled={secondsLeft > 0}
              >
                <Text className="text-[13px] text-cobalt-500 font-jakarta-bold">
                  {secondsLeft > 0
                    ? `Resend in 0:${String(secondsLeft).padStart(2, "0")}`
                    : "Resend code"}
                </Text>
              </Pressable>
            </View>
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
