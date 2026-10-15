import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { colors } from "@/theme/colors";

type Variant = "filled" | "empty" | "suggestion" | "warning";

const LOOK: Record<Variant, { box: string; text: string; icon: string }> = {
  filled: {
    box: "bg-cobalt-50 border border-cobalt-100",
    text: "text-cobalt-700",
    icon: colors.cobalt[700],
  },
  empty: {
    box: "border border-dashed border-cobalt-300",
    text: "text-cobalt-700",
    icon: colors.cobalt[700],
  },
  suggestion: {
    box: "bg-white border border-line",
    text: "text-ink",
    icon: colors.ink,
  },
  warning: {
    box: "bg-ember-50 border border-ember-300",
    text: "text-ember-700",
    icon: colors.ember[700],
  },
};

interface ChipProps {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  /** Shows the × and makes it a button of its own */
  onRemove?: () => void;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  variant = "filled",
  onPress,
  onRemove,
  accessibilityLabel,
}: ChipProps) {
  const look = LOOK[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={!onPress}
      onPress={onPress}
      // 40 point chip, 44 point touch target
      hitSlop={{ top: 2, bottom: 2 }}
      className={`h-10 max-w-full flex-row items-center gap-sm px-md rounded-full ${look.box}`}
    >
      {variant === "empty" && (
        <Ionicons name="add" size={16} color={look.icon} />
      )}
      {variant === "warning" && (
        <Ionicons name="alert-circle-outline" size={16} color={look.icon} />
      )}
      <Text numberOfLines={1} className={`shrink text-body ${look.text}`}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          hitSlop={12}
        >
          <Ionicons name="close" size={16} color={look.icon} />
        </Pressable>
      )}
    </Pressable>
  );
}
