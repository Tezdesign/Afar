import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { CARD_SHADOW } from "@/theme/shadow";

const RetryButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    className="h-[52px] items-center justify-center rounded-full bg-cobalt-500 px-lg"
    style={({ pressed }) => pressed && { opacity: 0.85 }}
  >
    <Text className="text-body text-white">Retry</Text>
  </Pressable>
);

/** Takes the place of content that failed to load. */
export function LoadError({
  title = "Can’t load this right now",
  body = "Check your connection, then try again.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      className="items-center gap-sm rounded-lg bg-white px-md py-lg"
      style={CARD_SHADOW}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-cobalt-50">
        <Ionicons name="alert" size={22} color={colors.cobalt[700]} />
      </View>
      <Text className="text-title text-ink text-center">{title}</Text>
      <Text className="text-body text-ink opacity-60 text-center">{body}</Text>
      <RetryButton onPress={onRetry} />
    </View>
  );
}

/** One failed strip on a screen that otherwise works. */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-sm rounded-lg bg-white px-md py-sm"
      style={CARD_SHADOW}
    >
      <Text className="flex-1 text-body text-ink">{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8} className="h-[44px] justify-center px-sm">
        <Text className="text-body text-cobalt-500">Retry</Text>
      </Pressable>
    </View>
  );
}
