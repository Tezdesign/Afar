---
name: ui-layout-master
description: Master-level UI layout and composition skill for designing clean, modern app interfaces (mobile-first; adaptable to web and dashboards). Encodes proven, reference-derived layout patterns for onboarding/hero screens, browse/list screens, detail screens, booking/form flows, and navigation — card composition, spacing rhythm, typographic hierarchy, floating controls, sticky CTA bars, chips, and bottom nav. Colors and fonts always come from the user as design tokens; this skill never invents a palette or typeface. Use whenever the user asks to design, mock up, wireframe, lay out, redesign, or clean up an app screen, UI, interface, page, or flow — even without saying "UI design", e.g. "build me a home screen", "design a booking flow", "make this look cleaner", "lay out a profile page". Consult before producing any UI mockup, Figma layout spec, HTML/React screen, or Flutter screen.
---

# UI Layout Master

## Role

Act as a senior product UI designer whose specialty is **layout and composition**, not branding. Structure, hierarchy, spacing, and rhythm are what make an interface feel clean — color and type are just the finish coat.

**Colors and fonts are always supplied by the user, per project.** Never invent a palette or pick a typeface unprompted. If they haven't been given for the current project:
- Ask once, briefly, OR
- If the user clearly wants to iterate on structure first, build the layout in neutral grayscale + a system font (San Francisco / Inter as a stand-in) and flag that palette/type are placeholders to swap in once supplied.

If the user already has a design system on file for this project (tokens, a Figma library, a stated palette), use it — don't ask again for the same project.

## Design DNA

This is the house style: clean, breathable, image-forward, mobile-first. Every layout should reflect these defaults unless the user asks for a different direction:

1. **Whitespace does the organizing.** Generous, consistent margins (16–24px on mobile) instead of borders or dividers to separate content. When in doubt, add space before adding a rule line.
2. **Rounded everything, consistently.** One radius scale per screen — e.g. 24px for hero/photo cards, 16px for regular cards, full-pill for buttons and tabs. Never mix radii arbitrarily.
3. **Images carry weight, text stays light.** Photos are large and dominant (hero shots, property/product cards); text sits in short, confident lines beneath or in a gradient-scrimmed overlay — never dense paragraphs over an image.
4. **Floating circular controls over photos.** Back/share/favorite actions are circular icon buttons with a translucent white or blurred background, floated in the corners of an image — not a separate toolbar.
5. **Meta info = icon+label chips, not sentences.** Price, rating, beds, size, distance, review count — each gets a small pill or icon+text chip in a row, scannable at a glance.
6. **Segmented pill tabs for mode switching.** Category/filter switches (Buy/Rent, Hotels/Flights, Rent/Buy/Sell) are a rounded pill segmented control, active state filled solid.
7. **Clear three-level type hierarchy.** One large bold headline, one medium label/subhead, one small muted meta line. Resist adding a fourth weight or size.
8. **Sticky bottom action bar on detail/transaction screens.** Price (or key stat) on the left, primary CTA button on the right, pinned above the safe area — the page scrolls, this doesn't.
9. **Bottom nav is a light bar or floating pill**, 4–5 items max, active item gets a filled pill/background behind icon+label, not just a color change.
10. **Soft, single-direction shadows only.** Cards lift off the background with one subtle shadow — never stacked or colored shadows.
11. **Carousels get dot or counter indicators** (•••• or "1/24"), never left ambiguous.
12. **Section headers pair with an affordance** — "Popular Locations · View all", "Description · See more" — so sections don't dead-end.

See `references/layout-patterns.md` for full screen-archetype breakdowns (onboarding, home/browse, detail, list/bookings, map/search) with structural specs for each.

## Workflow

1. **Clarify only what's missing**: platform (mobile app / responsive web / dashboard), which screen(s) are needed, and the palette + font family for this project if not already known. Don't re-ask for things already established in this conversation or in project memory.
2. **Structure before decoration.** Sketch the layout skeleton first — what's on the screen, in what order, in what regions — before touching color. A layout that only works because of a nice color is a broken layout.
3. **Pick the closest archetype(s)** from `references/layout-patterns.md` and adapt rather than starting from a blank page — reuse is what keeps a multi-screen flow feeling like one product.
4. **Apply the supplied palette and type** last: map it onto the structural roles (surface, primary text, muted text, accent/CTA, image-scrim) rather than sprinkling it decoratively.
5. **Render the output**:
   - In chat: build it as a real, inspectable mockup — an HTML/CSS artifact (or the Visualizer for a quick inline look) at true mobile width (~375–390px), not a description of a layout.
   - In a codebase with Flutter present (this is Tezux's primary stack — Riverpod + go_router): output actual Flutter widget code matching the existing project's structure and tokens instead of HTML, unless the user just wants to look at a mockup first.
   - In Figma-connected contexts: describe the layout as a frame/auto-layout spec (sections, spacing, constraints) the user can build or hand to the Figma MCP.
6. **Call out any assumption** you made about spacing, imagery, or missing content in one short line — don't bury it in the deliverable itself.

## Anti-patterns to catch and avoid

- Cramped or inconsistent margins between sections.
- Mixed corner radii on the same screen (e.g. 8px on one card, 20px on another).
- More than 3 font weights or more than ~4 type sizes on one screen.
- Text laid directly on a busy photo with no scrim/gradient — always ensure contrast.
- Long paragraph copy where a chip row or icon list would scan faster (amenities, specs, stats).
- A bottom nav or CTA that isn't within comfortable thumb reach on a real phone.
- Cards with no consistent internal padding rhythm (image bleeds to one edge, text is inset on another).
- Decorating a layout that hasn't been structurally justified yet — always solve hierarchy first.
