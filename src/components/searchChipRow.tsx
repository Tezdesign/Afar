import { View } from "react-native";

import { Chip } from "@/components/chip";
import { posthog } from "@/lib/posthog";
import { buildChips, type Field } from "@/lib/searchChips";
import { useSearchStore, type SearchParams } from "@/store/searchStore";

const MAX_UNRECOGNIZED = 3;

interface Props {
  /** Dashed empty chips for fields with no value (Search, not Results) */
  showEmpty?: boolean;
  /** Shorter labels, for the Results header */
  compact?: boolean;
  onEdit: (field: Field) => void;
}

export function SearchChipRow({ showEmpty = false, compact = false, onEdit }: Props) {
  const params = useSearchStore();
  const setSearchParams = useSearchStore((s) => s.setSearchParams);

  const remove = (field: string, patch: Partial<SearchParams>) => {
    setSearchParams(patch);
    posthog?.capture("search_chip_removed", { field });
  };

  const unrecognized = params.unrecognized;
  const hidden = unrecognized.length - MAX_UNRECOGNIZED;

  return (
    <View className="flex-row flex-wrap gap-sm">
      {buildChips(params, compact).map((chip) => {
        if (chip.label) {
          const clear = () => remove(chip.key, chip.clear);
          return (
            <Chip
              key={chip.key}
              label={chip.label}
              onPress={chip.field ? () => onEdit(chip.field as Field) : clear}
              onRemove={clear}
              accessibilityLabel={`${chip.name}, ${chip.label}, tap to change`}
            />
          );
        }
        if (showEmpty && chip.empty && chip.field) {
          const field = chip.field;
          return (
            <Chip
              key={chip.key}
              variant="empty"
              label={chip.empty}
              onPress={() => onEdit(field)}
              accessibilityLabel={`${chip.name}, not set, tap to add`}
            />
          );
        }
        return null;
      })}

      {/* Display only: these words never change a filter. */}
      {unrecognized.slice(0, MAX_UNRECOGNIZED).map((words, i) => {
        const dismiss = () =>
          remove("unrecognized", {
            unrecognized: unrecognized.filter((_, j) => j !== i),
          });
        return (
          <Chip
            key={`${words}-${i}`}
            variant="warning"
            label={`“${words}”`}
            onPress={dismiss}
            onRemove={dismiss}
            accessibilityLabel={`Not understood: ${words}, tap to dismiss`}
          />
        );
      })}
      {hidden > 0 && <Chip variant="suggestion" label={`+${hidden} more`} />}
    </View>
  );
}
