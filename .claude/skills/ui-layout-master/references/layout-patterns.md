# Layout Pattern Library

Structural specs for the core screen archetypes, distilled from clean travel/booking and real-estate app references. Each pattern lists **regions top-to-bottom**, what goes in each, and the spacing/structure rules — colors and fonts are never specified here, they're always the user's supplied tokens.

---

## 1. Onboarding / Hero screen

Full-bleed single photo, minimal chrome, one action.

- Full-bleed hero image, top-to-bottom, status bar overlaid directly on the image (light icons if the image is dark at the top).
- Bottom third: dark gradient scrim rising from the bottom edge so text stays legible regardless of image content.
- Over the scrim: one bold 2-line headline, one short supporting line (max ~2 sentences) below it.
- One full-width or wide-pill primary button, inset 20–24px from the bottom safe area.
- Optional: a thin horizontal "home indicator" bar or dot-progress row just below the button if this is step N of an onboarding sequence.
- No header, no nav, no secondary actions — one photo, one message, one action.

## 2. Home / Browse screen

The main list-of-things screen (hotels, properties, feed items).

**Header block**
- Row 1: avatar or logo+name on the left, 1–2 circular icon buttons on the right (search, notifications) — or a greeting ("Hi, Alex 👋") if the app is personalized.
- Row 2: one large bold headline stating the screen's purpose ("Book Your Perfect Stay", "Find your perfect place") OR a search bar with a filter icon if search is primary.
- Row 3: segmented pill tabs for top-level category switching (max 4 tabs visible, can scroll).

**Content block**
- A vertical (or horizontal-scroll for a "featured"/"popular" sub-section) stream of image-forward cards.
- Each card: large photo (16:9 or taller) with rounded corners (match the screen's card radius), floating circular icon buttons (share, favorite) top-right over the photo, optional status badge top-left ("Featured", "For Rent").
- Below the photo, inside the card: title (bold, 1 line, truncate), location/subtitle (muted, small, often with a pin icon), then a meta row of icon+text chips (price, rating, beds, sqft — 3–4 max, evenly spaced or wrapped).
- A horizontal-scroll row of smaller thumbnail chips is a good secondary section ("Popular Locations") — square/rounded thumbnail + one-line label underneath, no card chrome needed.
- Section headers get a "View all" link on the trailing edge when there's more content than shown.

**Bottom nav**
- 4–5 icons + labels, evenly spaced, in a bar (full-width, subtle top border/shadow) or a floating rounded pill inset from the edges.
- Active item: filled pill/rounded-rect behind the icon (and often the label), rest are plain icon+muted label.

## 3. Detail screen (property, room, listing)

Single-item deep dive, ends in a transaction action.

- Hero media at top: single image or carousel, near-full-bleed, rounded bottom corners if the screen background differs from the image edge.
- Floating circular buttons over the hero: back (top-left), share + save/favorite grouped (top-right).
- Carousel indicator: dot row for ≤6 images, or a small "1/24" counter pill (bottom-right of the image) for larger galleries.
- Below the image: title (large bold, can wrap 2 lines) + rating/review count on the same row or just beneath.
- A horizontal meta-stat row directly under the title: icon+value pairs (beds, baths, sqft, guests) — this is the "spec sheet" and should never be prose.
- A labeled section ("About", "Description", "Popular Amenities") with 2–4 lines of copy and a "Read more / See more" affordance if truncated; amenities specifically render as a wrapped row of pill chips, not a bullet list.
- Optional scheduling block: horizontal-scroll day chips (Mon 20 May, Tue 21 May…) above a row of time chips — single-select, selected state filled.
- **Sticky bottom bar**, separated from scroll content, safe-area padded: price (bold, large) + unit ("/night") stacked or inline on the left, primary CTA button ("Book Now", "Confirm Booking") filling the remaining width on the right.

## 4. List / History screen (bookings, orders, saved items)

Grouped, scannable records rather than browse cards.

- Header: back button + title ("My Bookings") + optional overflow/profile icon.
- Content grouped into labeled sections ("Upcoming", "Past") — section label as a small bold heading, not a card.
- Each row is a compact card: small thumbnail image (fixed square/rounded, left-aligned), title + one or two metadata lines (date, time) to its right, chevron or "View details" affordance trailing. A status badge ("Upcoming") floats top-right of the thumbnail or beside the title when relevant.
- Optional support/help card pinned near the bottom of the content (not sticky) with a short prompt + one action button/icon — keep it visually distinct (different fill) from the record cards above it.

## 5. Map / Search-results screen

Spatial browsing with an inline preview.

- Full-bleed map fills the background; a location/context dropdown floats near the top (e.g. "NYC, United States ▾") with a menu icon opposite it.
- Segmented pill tabs (Rent/Buy/Sell + a type dropdown) float as a row below the header, over the map.
- Numbered/priced cluster markers on the map (e.g. a filled pill showing "24" or a price range) instead of generic pins, so the map itself communicates density/value.
- A single result card is peeked at the bottom (or as a bottom-sheet), same card grammar as the Home/Browse pattern (photo, floating icon buttons, title, price, meta chips) — this is what changes as the user pans/taps the map.
- Bottom nav sits below or is temporarily hidden by the peeked card, per the app's usual nav pattern.

---

## Shared structural rules across all archetypes

- **Grid**: base spacing unit of 4px; use 8/12/16/20/24 multiples for padding and gaps — never odd values like 10 or 14.
- **Screen margin**: 16–20px from the device edge on mobile, consistent on every screen of the flow.
- **Card internal padding**: 12–16px on all sides once you're off the bleeding photo edge.
- **Radius scale**: pick 2–3 values max per project (e.g. 24 / 16 / full-pill) and apply them by role, not per-card judgment call.
- **Icon buttons**: circular, fixed size (40–44px hit target minimum), consistent whether floating on a photo or in a plain header.
- **Elevation**: one soft shadow token for "card above background," one (optional, slightly stronger) for "sticky bar above scroll content." Don't invent a third.
