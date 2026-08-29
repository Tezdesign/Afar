import { useSignIn, useSignUp } from "@clerk/expo";
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

import { clerkErrorCode, clerkErrorMessage } from "@/lib/clerk";
import { posthog } from "@/lib/posthog";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isValid = EMAIL_PATTERN.test(email.trim());

  const handleContinue = async () => {
    const emailAddress = email.trim();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Combined sign-in-or-up: try signing in first — sendCode creates
      // the sign-in attempt and sends the code in one call.
      const { error } = await signIn.emailCode.sendCode({ emailAddress });

      if (!error) {
        posthog?.capture("email_auth_code_requested", { auth_mode: "sign_in" });
        router.push({
          pathname: "/verify",
          params: { email: emailAddress, mode: "sign-in" },
        });
        return;
      }

      if (clerkErrorCode(error) !== "form_identifier_not_found") {
        setErrorMessage(clerkErrorMessage(error));
        return;
      }

      // No account with this email — switch to sign-up.
      const { error: signUpError } = await signUp.create({ emailAddress });
      if (signUpError) {
        setErrorMessage(clerkErrorMessage(signUpError));
        return;
      }

      const { error: sendCodeError } = await signUp.verifications.sendEmailCode();
      if (sendCodeError) {
        setErrorMessage(clerkErrorMessage(sendCodeError));
        return;
      }

      posthog?.capture("email_auth_code_requested", { auth_mode: "sign_up" });
      router.push({
        pathname: "/verify",
        params: { email: emailAddress, mode: "sign-up" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage(null);
            }}
            placeholder="you@example.com"
            placeholderTextColor="#8A8D9A"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            className="border border-line rounded-lg px-md py-md text-body text-ink"
          />

          {errorMessage ? (
            <Text className="text-[13px] text-red-500 mt-sm">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View className="flex-1" />

        {/* Bot-protection mount point — required on any screen that can
            trigger signUp.create(). */}
        <View nativeID="clerk-captcha" />

        <Pressable
          accessibilityRole="button"
          disabled={!isValid || isSubmitting}
          onPress={handleContinue}
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
            {isSubmitting ? "Please wait…" : "Continue"}
          </Text>
        </Pressable>

        <Text className="text-[12px] text-ink opacity-40 text-center mt-md">
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
