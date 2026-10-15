import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { AccessibilityInfo, Platform, Text, View } from "react-native";

import { colors } from "@/theme/colors";

export type LiveLineType =
  | "loading"
  | "priceLow"
  | "priceTypical"
  | "priceHigh"
  | "paused"
  | "unavailable"
  | "hint";

// Figma: "Live line" component set in "Live prices (spec 0003)".
const look: Record<
  LiveLineType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  loading: { bg: "bg-cobalt-50", icon: "time-outline", color: colors.cobalt[500] },
  // The tone follows Google's level: a high price is never shown as good news.
  priceLow: { bg: "bg-go-50", icon: "trending-down", color: colors.go },
  priceTypical: { bg: "bg-cloud border border-line", icon: "remove-outline", color: colors.ink },
  priceHigh: { bg: "bg-ember-50", icon: "trending-up", color: colors.ember[700] },
  paused: { bg: "bg-ember-50", icon: "pause-circle-outline", color: colors.ember[700] },
  unavailable: { bg: "bg-ember-50", icon: "alert-circle-outline", color: colors.ember[700] },
  hint: { bg: "bg-cloud border border-line", icon: "information-circle-outline", color: colors.ink },
};

/** One status line above Results (spec 0003, AC-9, AC-10). Announced to
 *  screen readers when it appears or changes (AC-16). */
export function LiveLine({ type, text }: { type: LiveLineType; text: string }) {
  const { bg, icon, color } = look[type];

  useEffect(() => {
    // Android reads the live region below; iOS needs an explicit announcement.
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <View
      accessibilityLiveRegion="polite"
      className={`flex-row items-center gap-sm rounded-md px-md py-sm ${bg}`}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text className="flex-1 text-caption text-ink">{text}</Text>
    </View>
  );
}
