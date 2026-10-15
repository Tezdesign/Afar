import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { FieldPicker } from "@/components/fieldPicker";
import { SearchChipRow } from "@/components/searchChipRow";
import { EXAMPLE_PROMPTS } from "@/lib/parseSearch";
import { posthog } from "@/lib/posthog";
import {
  buildChips,
  fieldValue,
  FIELD_NAME,
  type Field,
} from "@/lib/searchChips";
import { submitSentence } from "@/lib/submitSentence";
import { useSearchStore } from "@/store/searchStore";
import { colors } from "@/theme/colors";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

// Placeholder at 40% ink, like the Figma input.
const PLACEHOLDER = "rgba(23,24,31,0.4)";

// Header wash from the Figma frames: cobalt-100 fading into the page.
const WASH = ["rgba(220,229,253,0.9)", "rgba(241,244,249,0)"] as const;

const FORM_FIELDS: Field[] = ["where", "when", "budget", "from"];

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Entry points (Home pill, example, deal card) reset the store before they
  // navigate here, so a new search never starts with an old one's chips.
  const { q, source, focus } = useLocalSearchParams<{
    q?: string;
    source?: string;
    focus?: string;
  }>();
  const params = useSearchStore();

  const [text, setText] = useState(q ?? "");
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(q));
  const [picker, setPicker] = useState<Field | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const hasChips = buildChips(params, false).some((c) => c.label);
  const isEmpty = !hasChips && params.unrecognized.length === 0;
  const hasWhere = params.destination !== null || params.anywhere;
  const hasText = text.trim().length > 0;

  const submit = (sentence: string) => {
    if (!submitSentence(sentence)) return;
    setText(sentence);
    setSubmitted(true);
    Keyboard.dismiss();
  };

  const search = () => {
    posthog?.capture("travel_search_submitted", {
      has_destination: params.destination !== null,
      anywhere: params.anywhere,
      has_origin: params.origin !== null,
      has_dates: Boolean(params.month || params.departDate),
      has_budget: params.maxPrice !== null,
      unrecognized_count: params.unrecognized.length,
    });
    router.push("/results");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cloud"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={WASH}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
      />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingVertical: 16,
          gap: 16,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close search"
          onPress={() => router.replace("/")}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>

        <Text className="text-display text-ink">Where to?</Text>
        <View className="h-[3px] w-12 rounded-sm bg-cobalt-500" />

        <View
          className={`bg-white rounded-lg p-md gap-sm border-2 ${
            focused ? "border-cobalt-300" : "border-transparent"
          }`}
          style={CARD_SHADOW}
        >
          <Text className="text-caption text-ink opacity-50">
            Describe your trip
          </Text>
          <View className="flex-row items-center gap-sm">
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={() => submit(text)}
              autoFocus={focus === "1"}
              multiline
              submitBehavior="submit"
              returnKeyType="search"
              placeholder={
                isEmpty
                  ? `Try “${EXAMPLE_PROMPTS[0]}”`
                  : "Describe the whole trip, e.g. “Paris in March under 300 EUR”"
              }
              placeholderTextColor={PLACEHOLDER}
              accessibilityLabel="Describe your trip"
              className="flex-1 text-body text-ink"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Read my trip"
              disabled={!hasText}
              onPress={() => submit(text)}
              className={`w-10 h-10 items-center justify-center rounded-full ${
                hasText ? "bg-cobalt-500" : "bg-cobalt-100"
              }`}
            >
              <Ionicons
                name="arrow-forward"
                size={20}
                color={hasText ? "#FFFFFF" : colors.cobalt[300]}
              />
            </Pressable>
          </View>
          {isEmpty && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/assistant")}
              className="flex-row items-center gap-sm self-start py-xs"
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={colors.cobalt[500]}
              />
              <Text className="text-[14px] font-jakarta-medium text-cobalt-500">
                Prefer to talk it through? Ask Afar
              </Text>
            </Pressable>
          )}
        </View>

        {isEmpty ? (
          <>
            <Text className="text-caption text-ink opacity-50">Try</Text>
            <View className="flex-row flex-wrap gap-sm">
              {EXAMPLE_PROMPTS.map((example) => (
                <Chip
                  key={example}
                  variant="suggestion"
                  label={example}
                  onPress={() => submit(example)}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text className="text-caption text-ink opacity-50">
              {source === "deal" && !submitted
                ? "From your deal"
                : "Here’s what we understood"}
            </Text>
            <SearchChipRow showEmpty onEdit={setPicker} />
            <Text className="text-body text-ink opacity-60">
              Tap a chip to change it, or × to remove it.
            </Text>
            {params.unrecognized.length > 0 && (
              <View className="flex-row items-start gap-sm rounded-md bg-ember-50 p-md">
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.ember[700]}
                />
                <Text className="flex-1 text-body text-ink">
                  We couldn’t match{" "}
                  {params.unrecognized.map((words) => `“${words}”`).join(", ")}.
                  It won’t change your search.
                </Text>
              </View>
            )}
          </>
        )}

        <View className="bg-white rounded-lg overflow-hidden" style={CARD_SHADOW}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: formOpen }}
            onPress={() => setFormOpen((open) => !open)}
            className="flex-row items-center gap-sm p-md"
          >
            <Text className="flex-1 text-body text-ink">
              {formOpen ? "Hide the form" : "Use the form instead"}
            </Text>
            <Ionicons
              name={formOpen ? "chevron-up" : "chevron-forward"}
              size={20}
              color={colors.ink}
            />
          </Pressable>
          {formOpen &&
            FORM_FIELDS.map((field) => {
              const value = fieldValue(params, field);
              return (
                <Pressable
                  key={field}
                  accessibilityRole="button"
                  accessibilityLabel={
                    value
                      ? `${FIELD_NAME[field]}, ${value}, tap to change`
                      : `${FIELD_NAME[field]}, not set, tap to add`
                  }
                  onPress={() => setPicker(field)}
                  className="flex-row items-center gap-sm p-md border-t border-line"
                >
                  <View className="flex-1">
                    <Text className="text-caption text-ink opacity-50">
                      {field === "where"
                        ? "Where"
                        : field === "when"
                          ? "When"
                          : field === "budget"
                            ? "Budget"
                            : "From"}
                    </Text>
                    <Text
                      className={`text-body text-ink ${value ? "" : "opacity-40"}`}
                    >
                      {value ?? "Not set"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.ink} />
                </Pressable>
              );
            })}
        </View>
      </ScrollView>

      <View
        className="px-lg pt-md"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasWhere }}
          disabled={!hasWhere}
          onPress={search}
          className={`items-center justify-center rounded-full bg-cobalt-500 py-md ${
            hasWhere ? "" : "opacity-40"
          }`}
        >
          <Text className="text-body text-white">
            {params.unrecognized.length > 0 ? "Search without it" : "Search"}
          </Text>
        </Pressable>
      </View>

      <FieldPicker field={picker} onClose={() => setPicker(null)} />
    </KeyboardAvoidingView>
  );
}
