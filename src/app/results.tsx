import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DataLabel } from "@/components/dataLabel";
import { FieldPicker } from "@/components/fieldPicker";
import { LiveLine, type LiveLineType } from "@/components/liveLine";
import { LoadError } from "@/components/loadError";
import { SearchChipRow } from "@/components/searchChipRow";
import { SkeletonBar, SkeletonCard } from "@/components/skeleton";
import { parseISODate } from "@/lib/dates";
import { catalog } from "@/lib/db";
import { posthog } from "@/lib/posthog";
import type { Field } from "@/lib/searchChips";
import { withReasons } from "@/lib/searchFlights";
import { useAsync } from "@/lib/useAsync";
import { useLiveFlights, type LiveState } from "@/lib/useLiveFlights";
import { useAirportStore } from "@/store/airportStore";
import { useSearchStore } from "@/store/searchStore";
import { colors } from "@/theme/colors";
import { CARD_SHADOW } from "@/theme/shadow";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const PRICE_LEVEL = {
  low: { type: "priceLow", text: "Low for this route, per Google" },
  typical: { type: "priceTypical", text: "Typical for this route, per Google" },
  high: { type: "priceHigh", text: "High for this route, per Google" },
} as const;

const formatDuration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

/** The one status line above the list (spec 0003, AC-9, AC-10). */
const liveLineFor = (live: LiveState): { type: LiveLineType; text: string } | null => {
  if (live.status === "loading") return { type: "loading", text: "Checking live prices" };
  if (live.status === "hint")
    return live.hint === "no_origin"
      ? { type: "hint", text: "Pick a starting airport for live prices" }
      : live.hint === "no_date"
        ? { type: "hint", text: "Pick a date for live prices" }
        : null;
  const r = live.response;
  if (r.status === "fallback")
    return r.reason === "quota"
      ? { type: "paused", text: "Live prices are paused for this month" }
      : r.reason === "rate_limit"
        ? { type: "paused", text: "Live prices are paused for today" }
        : r.reason === "error"
          ? { type: "unavailable", text: "Live prices are unavailable right now" }
          : null;
  if (r.flights.length === 0)
    return { type: "hint", text: "Google Flights has no live prices for this search" };
  return r.priceLevel ? PRICE_LEVEL[r.priceLevel] : null;
};

const formatDate = (iso: string, weekday = false) =>
  parseISODate(iso).toLocaleDateString("en-US", {
    ...(weekday && { weekday: "short" }),
    month: "short",
    day: "numeric",
  });

export default function Results() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useSearchStore();
  const setSearchParams = useSearchStore((s) => s.setSearchParams);
  const airports = useAirportStore((s) => s.airports);
  const [picker, setPicker] = useState<Field | null>(null);

  const cityOf = (code: string, fallback?: string) =>
    airports.find((a) => a.code === code)?.city ?? fallback ?? code;

  // Only the fields that filter flights, so editing something else (such as
  // dismissing a "not understood" chip) does not search again.
  const searchKey = JSON.stringify([
    params.origin,
    params.destination,
    params.anywhere,
    params.month,
    params.nights,
    params.departDate,
    params.directOnly,
    params.maxPrice,
  ]);
  const { state, retry } = useAsync(
    () => catalog.searchFlights(params),
    searchKey,
  );
  const live = useLiveFlights(params, searchKey);
  const liveAnswer = live.state.status === "done" ? live.state.response : null;
  const liveSet =
    liveAnswer?.status === "live" && liveAnswer.flights.length > 0 ? liveAnswer : null;
  const liveLine = liveLineFor(live.state);

  // A month only route search goes live on a date the app picked. Make it a
  // real, editable date chip (contract rule 3) instead of a hidden guess.
  const { chosenDate } = live;
  useEffect(() => {
    if (chosenDate) setSearchParams({ departDate: chosenDate, month: null });
  }, [chosenDate, setSearchParams]);

  // Live replaces sample once it has flights (AC-7). Reasons are computed
  // within the live set only; Google's discount wins for a deal (AC-10).
  const liveResults = liveSet
    ? withReasons([...liveSet.flights].sort((a, b) => a.price - b.price)).map((r) =>
        r.flight.discountPercent
          ? { ...r, reason: `${r.flight.discountPercent}% below usual, per Google` }
          : r,
      )
    : null;
  const liveLabel = liveSet ? `Live · ${formatTime(liveSet.checkedAt)}` : null;

  const liveEvent =
    live.state.status === "hint" && live.state.hint === "no_origin"
      ? "no_origin"
      : liveAnswer?.status === "fallback"
        ? liveAnswer.reason
        : liveAnswer?.status === "live"
          ? "live"
          : null;
  const liveCount = liveAnswer?.status === "live" ? liveAnswer.flights.length : 0;
  const liveCached = liveAnswer?.status === "live" && liveAnswer.cached;
  const livePriceLevel = (liveAnswer?.status === "live" && liveAnswer.priceLevel) || null;
  const liveAnywhere = live.anywhere;
  useEffect(() => {
    if (!liveEvent) return;
    if (liveEvent === "live")
      posthog?.capture("live_prices_loaded", {
        count: liveCount,
        cached: liveCached,
        anywhere: liveAnywhere,
        price_level: livePriceLevel,
      });
    else posthog?.capture("live_prices_fallback", { reason: liveEvent });
  }, [liveEvent, liveCount, liveCached, liveAnywhere, livePriceLevel]);

  const results = liveResults ?? (state.status === "ready" ? state.data.results : []);
  const suggestions = state.status === "ready" ? state.data.suggestions : [];
  const none = !liveResults && state.status === "ready" && results.length === 0;

  // Fires when results arrive and whenever an edit changes the list.
  const resultCount = state.status === "ready" ? results.length : null;
  const hasBudget = params.maxPrice !== null;
  const hasUnrecognized = params.unrecognized.length > 0;
  useEffect(() => {
    if (resultCount === null) return;
    posthog?.capture("results_viewed", {
      result_count: resultCount,
      has_budget: hasBudget,
      has_unrecognized: hasUnrecognized,
    });
  }, [resultCount, hasBudget, hasUnrecognized]);

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

        {liveLine && <LiveLine type={liveLine.type} text={liveLine.text} />}

        {liveResults ? null : state.status === "loading" ? (
          <>
            <SkeletonBar className="h-4 w-[140px]" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : state.status === "error" ? (
          <LoadError title="Couldn’t load flights" onRetry={retry} />
        ) : none ? (
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
        ) : null}

        {(liveResults || (state.status === "ready" && !none)) && (
          <>
            <Text className="text-caption text-ink opacity-50">
              {results.length}{" "}
              {liveResults && live.anywhere ? "deal" : "result"}
              {results.length === 1 ? "" : "s"}
              {liveResults ? " · Google Flights" : ""} · cheapest first
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
                    {cityOf(flight.destinationCode, flight.destinationCity)}
                  </Text>
                  <Text className="text-numeric text-ink">
                    {flight.price} {flight.currency}
                  </Text>
                </View>
                <Text className="text-body text-ink opacity-60">
                  {flight.returnDate
                    ? `${formatDate(flight.departDate)} – ${formatDate(flight.returnDate)} · Round trip`
                    : `${formatDate(flight.departDate, true)} · One way`}
                  {flight.departTime
                    ? ` · ${flight.departTime} · ${formatDuration(flight.durationMinutes)}`
                    : ""}
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
                  <DataLabel label={liveLabel ?? undefined} />
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
