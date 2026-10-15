import { Text, View } from "react-native";

/** A short message. The parent decides where it sits and when it goes away. */
export function Toast({ message }: { message: string }) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="rounded-md bg-ink px-md py-sm"
    >
      <Text className="text-body text-white">{message}</Text>
    </View>
  );
}
