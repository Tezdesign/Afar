import { Text, View } from "react-native";

/** Every price is sample data until a live price source exists. */
export function DataLabel() {
  return (
    <View className="self-start rounded-sm bg-cloud px-sm py-xs">
      <Text className="text-caption text-ink opacity-60">Sample data</Text>
    </View>
  );
}
