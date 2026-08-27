import { useAuth } from "@clerk/expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { destinations } from "@/data/destinations";
import type { Destination } from "@/types/travel";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const CALENDAR_DISPLAY = Platform.select<"inline" | "calendar" | "default">({
  ios: "inline",
  android: "calendar",
  default: "default",
});

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

type Section = "destination" | "dates" | "guests" | null;

export default function WhereTo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>(null);
  const toggleSection = (section: Section) =>
    setActiveSection((current) => (current === section ? null : section));

  const [selected, setSelected] = useState<Destination | null>(null);

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [activeDateField, setActiveDateField] = useState<
    "checkIn" | "checkOut"
  >("checkIn");

  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [guestsConfirmed, setGuestsConfirmed] = useState(false);

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
        onPress={() => router.replace(isSignedIn ? "/" : "/onboarding")}
        hitSlop={12}
        className="w-10 h-10 items-center justify-center rounded-full bg-white"
      >
        <Ionicons name="close" size={20} color="#17181F" />
      </Pressable>

      <Text className="text-display text-ink mt-xl mb-lg">Where to?</Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          className="bg-white rounded-lg overflow-hidden"
          style={CARD_SHADOW}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => toggleSection("destination")}
            className="flex-row items-center gap-sm px-md py-md border-b border-line"
          >
            <Ionicons name="location" size={18} color="#1D4FD6" />
            <View className="flex-1">
              <Text className="text-caption text-ink opacity-50">
                Destination
              </Text>
              <Text className="text-body text-ink">
                {selected
                  ? `${selected.city}, ${selected.country}`
                  : "Where are you going?"}
              </Text>
            </View>
            <Ionicons
              name={
                activeSection === "destination" ? "chevron-up" : "chevron-down"
              }
              size={16}
              color="#17181F"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => toggleSection("dates")}
            className="flex-row items-center gap-sm px-md py-md border-b border-line"
          >
            <Ionicons name="calendar" size={18} color="#1D4FD6" />
            <View className="flex-1">
              <Text className="text-caption text-ink opacity-50">Dates</Text>
              <Text className="text-body text-ink">
                {checkIn && checkOut
                  ? `${formatDate(checkIn)} – ${formatDate(checkOut)}`
                  : "Add dates"}
              </Text>
            </View>
            <Ionicons
              name={activeSection === "dates" ? "chevron-up" : "chevron-down"}
              size={16}
              color="#17181F"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => toggleSection("guests")}
            className="flex-row items-center gap-sm px-md py-md"
          >
            <Ionicons name="people" size={18} color="#1D4FD6" />
            <View className="flex-1">
              <Text className="text-caption text-ink opacity-50">
                Travelers
              </Text>
              <Text className="text-body text-ink">
                {guestsConfirmed
                  ? `${adults} adult${adults > 1 ? "s" : ""}${
                      kids > 0 ? `, ${kids} kid${kids > 1 ? "s" : ""}` : ""
                    }`
                  : "Add guests"}
              </Text>
            </View>
            <Ionicons
              name={activeSection === "guests" ? "chevron-up" : "chevron-down"}
              size={16}
              color="#17181F"
            />
          </Pressable>
        </View>

        {activeSection === "destination" && (
          <View
            className="bg-white rounded-lg mt-sm overflow-hidden"
            style={CARD_SHADOW}
          >
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              {destinations.map((destination, index) => (
                <Pressable
                  key={destination.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelected(destination);
                    setActiveSection(null);
                  }}
                  className={`flex-row items-center justify-between px-md py-md ${
                    index < destinations.length - 1
                      ? "border-b border-line"
                      : ""
                  }`}
                >
                  <View>
                    <Text className="text-body text-ink font-jakarta-bold">
                      {destination.city}
                    </Text>
                    <Text className="text-[13px] text-ink opacity-50">
                      {destination.country}
                    </Text>
                  </View>
                  <Text className="text-[13px] text-ink opacity-60">
                    from {destination.priceFrom} {destination.currency}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {activeSection === "dates" && (
          <View
            className="bg-white rounded-lg mt-sm overflow-hidden px-md py-md"
            style={CARD_SHADOW}
          >
            <View className="flex-row gap-sm mb-md">
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveDateField("checkIn")}
                className={`flex-1 items-center rounded-full py-sm ${
                  activeDateField === "checkIn" ? "bg-cobalt-500" : "bg-cloud"
                }`}
              >
                <Text
                  className={`text-[13px] font-jakarta-bold ${
                    activeDateField === "checkIn"
                      ? "text-white"
                      : "text-ink opacity-60"
                  }`}
                >
                  {checkIn ? `Check-in · ${formatDate(checkIn)}` : "Check-in"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveDateField("checkOut")}
                className={`flex-1 items-center rounded-full py-sm ${
                  activeDateField === "checkOut" ? "bg-cobalt-500" : "bg-cloud"
                }`}
              >
                <Text
                  className={`text-[13px] font-jakarta-bold ${
                    activeDateField === "checkOut"
                      ? "text-white"
                      : "text-ink opacity-60"
                  }`}
                >
                  {checkOut
                    ? `Check-out · ${formatDate(checkOut)}`
                    : "Check-out"}
                </Text>
              </Pressable>
            </View>

            {/* The native calendar's own layout/typography can't be reached
                by NativeWind classes — it's a platform view, per AGENTS.md's
                style-exception rule. */}
            <DateTimePicker
              value={
                (activeDateField === "checkIn" ? checkIn : checkOut) ??
                checkIn ??
                new Date()
              }
              mode="date"
              display={CALENDAR_DISPLAY}
              minimumDate={
                activeDateField === "checkOut" && checkIn
                  ? checkIn
                  : new Date()
              }
              accentColor="#1D4FD6"
              onChange={(_event, date) => {
                if (!date) return;
                if (activeDateField === "checkIn") {
                  setCheckIn(date);
                  if (checkOut && checkOut < date) setCheckOut(null);
                  setActiveDateField("checkOut");
                } else {
                  setCheckOut(date);
                }
              }}
            />
          </View>
        )}

        {activeSection === "guests" && (
          <View
            className="bg-white rounded-lg mt-sm overflow-hidden px-md"
            style={CARD_SHADOW}
          >
            <View className="flex-row items-center justify-between py-md border-b border-line">
              <View>
                <Text className="text-body text-ink font-jakarta-bold">
                  Adults
                </Text>
                <Text className="text-[13px] text-ink opacity-50">
                  Ages 13 or above
                </Text>
              </View>
              <View className="flex-row items-center gap-md">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdults((n) => Math.max(1, n - 1))}
                  className="w-8 h-8 items-center justify-center rounded-full border border-line"
                >
                  <Ionicons name="remove" size={16} color="#17181F" />
                </Pressable>
                <Text className="text-body text-ink w-6 text-center">
                  {adults}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdults((n) => n + 1)}
                  className="w-8 h-8 items-center justify-center rounded-full border border-line"
                >
                  <Ionicons name="add" size={16} color="#17181F" />
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center justify-between py-md">
              <View>
                <Text className="text-body text-ink font-jakarta-bold">
                  Kids
                </Text>
                <Text className="text-[13px] text-ink opacity-50">
                  Ages 2–12
                </Text>
              </View>
              <View className="flex-row items-center gap-md">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setKids((n) => Math.max(0, n - 1))}
                  className="w-8 h-8 items-center justify-center rounded-full border border-line"
                >
                  <Ionicons name="remove" size={16} color="#17181F" />
                </Pressable>
                <Text className="text-body text-ink w-6 text-center">
                  {kids}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setKids((n) => n + 1)}
                  className="w-8 h-8 items-center justify-center rounded-full border border-line"
                >
                  <Ionicons name="add" size={16} color="#17181F" />
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setGuestsConfirmed(true);
                setActiveSection(null);
              }}
              className="items-center justify-center rounded-full bg-cobalt-500 py-sm my-md"
            >
              <Text className="text-[13px] font-jakarta-bold text-white">
                Done
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={!selected}
        className={`flex-row items-center justify-center gap-sm rounded-full py-md mt-sm ${
          selected ? "bg-cobalt-500" : "bg-cobalt-100"
        }`}
      >
        <Ionicons
          name="search"
          size={16}
          color={selected ? "#fff" : "#7C97F0"}
        />
        <Text
          className={`text-[14px] font-jakarta-bold ${
            selected ? "text-white" : "text-cobalt-300"
          }`}
        >
          Search
        </Text>
      </Pressable>
    </View>
  );
}
