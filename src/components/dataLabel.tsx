import { Text, View } from "react-native";

/** Where a price came from: "Sample data", or "Live · 14:05" for a live
 *  price (spec 0003). Every price on screen carries one. */
export function DataLabel({ label = "Sample data" }: { label?: string }) {
  return (
    <View className="self-start rounded-sm bg-cloud px-sm py-xs">
      <Text className="text-caption text-ink opacity-60">{label}</Text>
    </View>
  );
}
