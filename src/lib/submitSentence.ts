import { airports } from "@/data/airports";
import { parseSearch } from "@/lib/parseSearch";
import { posthog } from "@/lib/posthog";
import { buildChips } from "@/lib/searchChips";
import { useSearchStore } from "@/store/searchStore";

/**
 * Replaces the whole search with what the sentence says (a second sentence
 * never merges with the first). Returns false for blank text.
 */
export function submitSentence(sentence: string) {
  const text = sentence.trim();
  if (!text) return false;

  const { params, unrecognized } = parseSearch(text, new Date(), airports);
  const { reset, setSearchParams } = useSearchStore.getState();
  reset();
  setSearchParams({ ...params, unrecognized });

  // Counts only. The typed text is never sent anywhere.
  posthog?.capture("search_text_submitted", {
    chip_count: buildChips(useSearchStore.getState(), false).filter(
      (c) => c.label,
    ).length,
    unrecognized_count: unrecognized.length,
  });
  return true;
}
