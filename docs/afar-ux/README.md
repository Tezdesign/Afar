# Afar UX

Design-thinking record for Afar: Empathize → Define → Ideate → Prototype → Test.

| Step | File | Status |
|---|---|---|
| 1. Empathize | [01-empathize.md](01-empathize.md) | Hypotheses; interviews not done |
| 2. Define | [02-define.md](02-define.md) | Draft |
| 3. Ideate | — | Not started |
| 4. Prototype | — | Not started |
| 5. Test | — | Not started |

## Decisions log

| Decision | Why | Alternative considered |
|---|---|---|
| Natural-language input lives on the home search card, not inside the assistant | Search is one-shot and user-controlled; the assistant is multi-step and acts. Keeps the two ideas separate and the entry light | Put it inside the assistant |
| Assistant: voice to ask, screen to decide; cards are the source of truth | Confirmation needs something to read and tap; voice is unreliable in noise and in some languages | Voice-only assistant |
| Voice confirms nothing with cost or commitment; harmless actions may be voice | A misheard "yes" is the failure Confirm exists to prevent | Accept spoken confirmations everywhere |
| International product, segments by behavior not nationality | Incumbents are global; Afar's edge is trust and control, not geography | Tunisia-first positioning |
| Real data via Supabase for Afar's own data | Alerts, profile, saved, activity log need persistence | Stay on hardcoded sample data |
| AI lines state only what the data supports | Real users act on them; invented history undermines the trust pitch | Show simulated price history |
