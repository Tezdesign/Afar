import { posthog } from "@/lib/posthog";
import { supabase } from "@/lib/supabase";

import { createAccount } from "./account";
import { createCatalog } from "./catalog";

// Table and operation only, never row data or typed text.
const reportError = (table: string, operation: string) =>
  posthog?.capture("supabase_error", { table, operation });

export const catalog = createCatalog(supabase, reportError);
export const account = createAccount(supabase, reportError);
