import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAB_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.16,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 24,
  elevation: 6,
} as const;

// Tab bar's own height isn't exposed to layout code, so this offset is an
// estimate (bar + its own bottom inset) tuned to clear it on iOS/Android.
const TAB_BAR_HEIGHT = 58;

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // No blanket auth guard here — Home and Search are open to guests.
  // Trips, Saved, and Profile each guard themselves individually, since
  // they're inherently tied to an account.
  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1D4FD6",
          tabBarInactiveTintColor: "#8A8D9A",
          tabBarStyle: { borderTopColor: "#E5E7EB" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: "Trips",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: "Saved",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Global entry point for the trip assistant (chat + voice, not tied
          to any one tab) — floats above the tab bar on every tab per the
          confirmed IA. Home has its own "Ask Afar" link instead. */}
      {pathname !== "/" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open trip assistant"
          onPress={() => router.push("/assistant")}
          className="absolute right-lg w-14 h-14 items-center justify-center rounded-full bg-cobalt-500"
          style={[{ bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }, FAB_SHADOW]}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
