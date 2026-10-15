import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { airports } from "@/data/airports";
import { parseISODate, toISODate } from "@/lib/dates";
import { posthog } from "@/lib/posthog";
import type { Field } from "@/lib/searchChips";
import { useSearchStore, type SearchParams } from "@/store/searchStore";
import { colors } from "@/theme/colors";

const TITLE: Record<Field, string> = {
  where: "Where to?",
  from: "Flying from",
  when: "When",
  budget: "Budget",
};

const BUDGETS = [100, 150, 200, 250, 300, 400, 500, 750, 1000];

// The native calendar is a platform view, NativeWind can't reach it.
const CALENDAR_DISPLAY = Platform.select<"inline" | "calendar" | "default">({
  ios: "inline",
  android: "calendar",
  default: "default",
});

function Row({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center px-lg py-md border-b border-line"
    >
      <Text className="flex-1 text-body text-ink">{label}</Text>
      {selected && (
        <Ionicons name="checkmark" size={20} color={colors.cobalt[500]} />
      )}
    </Pressable>
  );
}

/** The one place a chip or a form row edits its field. */
export function FieldPicker({
  field,
  onClose,
}: {
  field: Field | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const params = useSearchStore();
  const setSearchParams = useSearchStore((s) => s.setSearchParams);
  const [showDate, setShowDate] = useState(false);

  const edit = (patch: Partial<SearchParams>, close = true) => {
    setSearchParams(patch);
    if (field) posthog?.capture("search_chip_edited", { field });
    if (close) onClose();
  };

  const airportRows = (selectedCode: string | null, pick: (code: string) => void) =>
    airports.map((a) => (
      <Row
        key={a.code}
        label={`${a.city}, ${a.country} (${a.code})`}
        selected={selectedCode === a.code}
        onPress={() => pick(a.code)}
      />
    ));

  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const name = d.toLocaleDateString("en-US", { month: "short" });
    return {
      value: toISODate(d).slice(0, 7),
      label: d.getFullYear() === today.getFullYear() ? name : `${name} ${d.getFullYear()}`,
    };
  });

  return (
    <Modal
      visible={field !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-ink/40">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="flex-1"
        />
        {field && (
          <View
            className="bg-white rounded-t-lg"
            style={{ paddingBottom: insets.bottom + 8, maxHeight: "80%" }}
          >
            <View className="flex-row items-center justify-between px-lg py-md">
              <Text className="text-title text-ink">{TITLE[field]}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={12}
                className="w-10 h-10 items-center justify-center rounded-full bg-cloud"
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView>
              {field === "where" && (
                <>
                  <Row
                    label="Anywhere"
                    selected={params.anywhere}
                    onPress={() => edit({ anywhere: true })}
                  />
                  {airportRows(params.anywhere ? null : params.destination, (code) =>
                    edit({ destination: code }),
                  )}
                </>
              )}

              {field === "from" && (
                <>
                  <Row
                    label="Any airport"
                    selected={params.origin === null}
                    onPress={() => edit({ origin: null })}
                  />
                  {airportRows(params.origin, (code) => edit({ origin: code }))}
                </>
              )}

              {field === "budget" && (
                <>
                  <Row
                    label="Any budget"
                    selected={params.maxPrice === null}
                    onPress={() => edit({ maxPrice: null })}
                  />
                  {BUDGETS.map((n) => (
                    <Row
                      key={n}
                      label={`Under ${n} EUR`}
                      selected={params.maxPrice === n}
                      onPress={() => edit({ maxPrice: n })}
                    />
                  ))}
                </>
              )}

              {field === "when" && (
                <View className="px-lg pb-md gap-md">
                  <Text className="text-caption text-ink opacity-50">Month</Text>
                  <View className="flex-row flex-wrap gap-sm">
                    {months.map((m) => {
                      const selected = !params.departDate && params.month === m.value;
                      return (
                        <Chip
                          key={m.value}
                          label={m.label}
                          variant={selected ? "filled" : "suggestion"}
                          accessibilityLabel={`${m.label}${selected ? ", selected" : ""}`}
                          onPress={() =>
                            edit(
                              { month: m.value, departDate: null, returnDate: null },
                              false,
                            )
                          }
                        />
                      );
                    })}
                  </View>

                  <Text className="text-caption text-ink opacity-50">Exact date</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowDate((open) => !open)}
                    className="flex-row items-center justify-between rounded-lg border border-line px-md py-md"
                  >
                    <Text className="text-body text-ink">
                      {params.departDate
                        ? parseISODate(params.departDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "Pick a date"}
                    </Text>
                    <Ionicons
                      name={showDate ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.ink}
                    />
                  </Pressable>
                  {showDate && (
                    <DateTimePicker
                      value={params.departDate ? parseISODate(params.departDate) : today}
                      mode="date"
                      display={CALENDAR_DISPLAY}
                      minimumDate={today}
                      accentColor={colors.cobalt[500]}
                      onChange={(_event, date) => {
                        if (!date) return;
                        edit(
                          { departDate: toISODate(date), returnDate: null, month: null },
                          false,
                        );
                      }}
                    />
                  )}

                  <Text className="text-caption text-ink opacity-50">Trip length</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-body text-ink">
                      {params.nights
                        ? `${params.nights} night${params.nights > 1 ? "s" : ""}`
                        : "Any length"}
                    </Text>
                    <View className="flex-row items-center gap-md">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fewer nights"
                        hitSlop={4}
                        onPress={() =>
                          edit(
                            { nights: params.nights && params.nights > 1 ? params.nights - 1 : null },
                            false,
                          )
                        }
                        className="w-10 h-10 items-center justify-center rounded-full border border-line"
                      >
                        <Ionicons name="remove" size={16} color={colors.ink} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="More nights"
                        hitSlop={4}
                        onPress={() =>
                          edit({ nights: Math.min(30, (params.nights ?? 0) + 1) }, false)
                        }
                        className="w-10 h-10 items-center justify-center rounded-full border border-line"
                      >
                        <Ionicons name="add" size={16} color={colors.ink} />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={onClose}
                    className="items-center justify-center rounded-full bg-cobalt-500 py-md"
                  >
                    <Text className="text-body text-white">Done</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}
