import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

export default function Assistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-cloud px-lg"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        hitSlop={12}
        className="w-10 h-10 items-center justify-center rounded-full bg-white"
      >
        <Ionicons name="close" size={20} color="#17181F" />
      </Pressable>

      <View className="flex-1 items-center justify-center gap-sm">
        <View className="w-16 h-16 items-center justify-center rounded-full bg-cobalt-100">
          <Ionicons name="chatbubble-ellipses" size={28} color="#1D4FD6" />
        </View>
        <Text className="text-title text-ink text-center mt-sm">
          Trip assistant
        </Text>
        <Text className="text-body text-ink opacity-60 text-center max-w-[280px]">
          Ask a question by text or voice about your trip — chat is coming
          soon.
        </Text>
      </View>

      <View
        className="flex-row items-center gap-sm bg-white rounded-full px-md py-sm"
        style={CARD_SHADOW}
      >
        <TextInput
          editable={false}
          placeholder="Ask about flights, hotels, cars…"
          placeholderTextColor="#8A8D9A"
          className="flex-1 text-body text-ink"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Talk to the assistant"
          className="w-9 h-9 items-center justify-center rounded-full bg-cobalt-500"
        >
          <Ionicons name="mic" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
