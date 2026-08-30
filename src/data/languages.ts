// Typed list of languages selectable from Profile > Language. Hardcoded
// per AGENTS.md's Important Constraints (no database for this version).

export interface Language {
  code: string;
  name: string;
}

export const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "ar", name: "العربية" },
  { code: "it", name: "Italiano" },
];
