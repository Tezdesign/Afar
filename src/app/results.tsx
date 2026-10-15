import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DataLabel } from "@/components/dataLabel";
import { FieldPicker } from "@/components/fieldPicker";
import { SearchChipRow } from "@/components/searchChipRow";
import { airports } from "@/data/airports";
import { flights } from "@/data/flights";
import { parseISODate } from "@/lib/dates";
import { posthog } from "@/lib/posthog";
import type { Field } from "@/lib/searchChips";
import { searchFlights } from "@/lib/searchFlights";
import { useSearchStore } from "@/store/searchStore";
import { colors } from "@/theme/colors";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const formatDate = (iso: string, weekday = false) =>
  parseISODate(iso).toLocaleDateString("en-US", {
    ...(weekday && { weekday: "short" }),
    month: "short",
    day: "numeric",
  });

const cityOf = (code: string) =>
  airports.find((a) => a.code === code)?.city ?? code;

export default function Results() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useSearchStore();
  const setSearchParams = useSearchStore((s) => s.setSearchParams);
  const [picker, setPicker] = useState<Field | null>(null);

  const { results, suggestions } = searchFlights(flights, params);
  const none = results.length === 0;

  // Fires when the screen appears and whenever an edit changes the list.
  const hasBudget = params.maxPrice !== null;
  const hasUnrecognized = params.unrecognized.length > 0;
  useEffect(() => {
    posthog?.capture("results_viewed", {
      result_count: results.length,
      has_budget: hasBudget,
      has_unrecognized: hasUnrecognized,
    });
  }, [results.length, hasBudget, hasUnrecognized]);

  return (
    <View className="flex-1 bg-cloud">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>

        <SearchChipRow compact onEdit={setPicker} />

        {none ? (
          <>
            <View className="gap-sm px-md pt-xl pb-md">
              <Text className="text-title text-ink">No flights match yet</Text>
              <Text className="text-body text-ink opacity-60">
                {suggestions.length > 0
                  ? "Nothing matches these filters. Here’s what we’d try:"
                  : "Nothing matches these filters. Try changing your search."}
              </Text>
            </View>
            {suggestions.length > 0 && (
              <View
                className="bg-white rounded-lg overflow-hidden"
                style={CARD_SHADOW}
              >
                {suggestions.map((s, i) => (
                  <Pressable
                    key={s.kind}
                    accessibilityRole="button"
                    onPress={() => {
                      setSearchParams(s.patch);
                      posthog?.capture("suggestion_applied", { kind: s.kind });
                    }}
                    className={`flex-row items-center gap-sm p-md ${
                      i < suggestions.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <Text className="flex-1 text-body text-ink">{s.label}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.ink}
                    />
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="items-center justify-center py-md"
            >
              <Text className="text-body text-cobalt-500">Edit search</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-caption text-ink opacity-50">
              {results.length} result{results.length === 1 ? "" : "s"} · cheapest
              first
            </Text>
            {results.map(({ flight, reason }, index) => (
              <Pressable
                key={flight.id}
                accessibilityRole="button"
                onPress={() => {
                  posthog?.capture("deal_opened", {
                    flight_id: flight.id,
                    position: index + 1,
                  });
                  router.push(`/flight/${flight.id}`);
                }}
                className="bg-white rounded-lg p-md gap-sm"
                style={CARD_SHADOW}
              >
                <View className="flex-row items-center gap-sm">
                  <Text className="flex-1 text-body text-ink">
                    {cityOf(flight.originCode)} →{" "}
                    {cityOf(flight.destinationCode)}
                  </Text>
                  <Text className="text-numeric text-ink">
                    {flight.price} {flight.currency}
                  </Text>
                </View>
                <Text className="text-body text-ink opacity-60">
                  {flight.returnDate
                    ? `${formatDate(flight.departDate)} – ${formatDate(flight.returnDate)} · Round trip`
                    : `${formatDate(flight.departDate, true)} · One way`}
                  {" · "}
                  {flight.airline}
                </Text>
                {reason !== "" && (
                  <View className="flex-row items-center gap-sm rounded-md bg-cobalt-50 px-sm py-xs">
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.cobalt[700]}
                    />
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-body text-cobalt-700"
                    >
                      {reason}
                    </Text>
                  </View>
                )}
                <View className="items-end">
                  <DataLabel />
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <FieldPicker field={picker} onClose={() => setPicker(null)} />
    </View>
  );
}
