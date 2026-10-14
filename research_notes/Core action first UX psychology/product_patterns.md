# Product patterns: "open on the core action", onboarding, sign-in and personalization

Research date: 2026-10-14. Method note: I could not install or screen-record the apps. Most per-product first-launch details below come from secondary write-ups, many of them dated; where a detail could not be verified from a source it is marked UNVERIFIED. Several products (Google Search app, Booking.com, Airbnb, Google Flights current homepage, Hopper, ChatGPT mobile) had little or no authoritative first-launch documentation in what I could retrieve. Treat any "current behaviour" claim as needing a quick check on a fresh install.

## What is the first screen on first launch versus returning launch? Is there a tour, permission prompt, login wall or personalization quiz before the core action?

### Takeaway
Among the products where I found evidence, only Spotify (taste quiz after sign-in), Duolingo (goal/level questions) and, in one captured version, Kayak (skippable sign-in screen) put anything between install and the core action. Uber, Skyscanner, Google Flights and Perplexity are documented as opening on or near the core action, with no tour. Several products (Airbnb, Booking.com, Hopper, ChatGPT mobile, Google Search app, Google Maps) are not verifiable at first-launch level from the sources I could retrieve.

### Cited Findings
- Uber (2016, official): the rider app was "reimagined around a simple question—'Where to?'", with the stated reasoning "by starting with your destination, we can tailor the journey to you"; Uber said the app had become "complicated and harder to navigate" after its 2012 design. Frequent riders see suggested destinations (shortcuts) bookable in one tap. — [Uber newsroom, 2 Nov 2016](https://www.uber.com/us/en/newsroom/newriderapp/)
- Uber (2016, trade press): ride types were moved off the first screen and appear only after a destination is chosen; a second, practical reason reported is that asking for the destination first gives GPS time to warm up and locate the rider. — [Mobile Marketing Magazine summary via search result, 2016](https://mobilemarketingmagazine.com/uber-redesigns-app-focusing-on-a-single-question/) (page returned 403 on direct fetch; content seen only in a search snippet; the GPS rationale is the reporter's claim, not confirmed in Uber's newsroom text I read)
- Uber (2019 and later): coverage says the "Where to?" map-plus-search start was replaced in the 2019 redesign by a minimal grid of services, and a later redesign (undated in my source) added a rides/delivery toggle. So Uber's first screen is no longer purely destination-first; this is a search-snippet-level claim, not verified against Uber. — [It's Nice That, 27 Sep 2019](https://www.itsnicethat.com/news/uber-redesign-digital-270919) (snippet only; I did not open the page)
- Duolingo: described by Appcues as welcome, then goal setting ("Why are you learning?"), then self-selected skill level (or a placement test), then bite-sized lessons on a dashboard usable without an account; sign-up prompts come after lessons, and leaderboards and some features stay locked for unregistered users. — [Appcues / Really Good UX (undated)](https://goodux.appcues.com/blog/duolingo-user-onboarding)
- Spotify (2018, official): "taste onboarding" appears right after you first download and sign in to the free app: you are asked to choose five or more artists. Spotify's stated reason: it learns your favourite artists, songs and genres faster, then builds playlists and tailors the home screen. — [Spotify Newsroom, 27 Aug 2018](https://newsroom.spotify.com/tag/taste-onboarding/)
- Spotify (teardown, older): welcome screen offers sign in, Facebook, or register; after account creation the user is dropped into artist selection, then a personalised home feed; a search bar lets users add an artist not shown; a community answer says redoing onboarding requires a new account. — [Uxcel teardown](https://app.uxcel.com/showcase/spotifys-new-user-onboarding-feature-product-teardown-222), [Spotify community thread](https://community.spotify.com/t5/Your-Library/Redo-the-onboarding/td-p/4997715) (both from a search summary; undated, probably pre-2020; current flow UNVERIFIED)
- Skyscanner (Pratt IXD student critique, 13 Sep 2023, Android): home screen is essentially the Explore screen with three service choices (flights, hotels, car hire), large promo tiles ("Explore everywhere", hot deals, "12 ways we can help you"), no prominent search bar until a service is picked, and no onboarding or navigation tour. The critique says nothing about sign-in prompts. It is a student analysis and does not specify the app version. — [IXD@Pratt](https://ixd.prattsi.org/2023/09/design-critique-skyscanner-android-mobile-app/)
- Kayak: a third-party design archive capture shows a sign-in screen with a Skip option, listing benefits (private deals, real-time travel alerts, synced travel plans) and Apple/email/Google choices. Capture date unknown; whether Skip persists in the current release is UNVERIFIED. — [Lazyweb flow capture](https://www.lazyweb.com/canvas/flows/kayak/sign-in-with-google) (seen only via search summary; the direct URL redirected, so I could not open it)
- Hopper: a ScreensDesign showcase says the app has 2 onboarding steps (not described), a Google Sign-In step at about 00:26 in its recording, and a dense home screen with Stays/Flights/Cars cards, Carrot Cash rewards, tree-planting and recent searches. The page gave no app date and does not confirm whether sign-in happens before or after the home screen. — [ScreensDesign](https://screensdesign.com/showcase/hopper-flights-hotels-cars)
- Perplexity: third-party guides say basic search works without an account and a gentle sign-up prompt comes after first use; the same guide (a September 2026 third-party blog citing Perplexity docs) says Pro Search and file uploads need sign-in and guest sessions disappear after 14 days. I could not verify these against Perplexity's own documentation. — [Perplexity AI Magazine (third-party)](https://perplexityaimagazine.com/perplexity-hub/can-i-use-perplexity-without-creating-an-account/), [Supademo user-flow gallery](https://supademo.com/user-flow-examples/perplexity)
- Google Maps (2024): the bottom bar was cut from five tabs (Explore, Go, Saved, Contribute, Updates) to three (Explore, You, Contribute) on Android in version 11.138.x; the article says it "simplifies the bottom bar" and frees space for other content. The article does not describe the home search bar or location prompt. A guide describes the first view as a map with a search bar and account icon at the top. — [9to5Google, 31 Jul 2024](https://9to5google.com/2024/07/31/google-maps-bottom-bar-redesign-rolling-out/)
- Airbnb (2025, official): redesigned app has Homes, Experiences and Services top-level tabs and an "all-new" Explore homepage for discovery; Trips, Messages and Profile are the other areas. The release does not describe first-launch sign-in or a search bar. — [Airbnb 2025 Summer Release](https://news.airbnb.com/product-releases/airbnb-2025-summer-release/)
- Google Search app and google.com mobile: a report says the mobile homepage was redesigned to resemble the Google app, with the Discover feed placed immediately below the search bar; desktop tests of Discover below the search bar were reported in some countries. I did not retrieve the original article or date. — [PR Daily summary](https://prdaily.com/?p=254846), [Search Engine Journal](https://www.searchenginejournal.com/google-experiments-with-desktop-discover-feed/498422/) (search snippets only; dates not confirmed)

### Inferences
- Inference: the "core action first" group (Uber, Skyscanner, Google Flights, Perplexity, Google Maps) are all products where the user arrives with a task already in mind and where the first useful output (a fare, an answer, a route) does not need to know who you are. The "personalise first" group (Spotify, Duolingo) are products where the output is content tailored to taste or level, so a few questions are the core action's input.
- Inference: Skyscanner's 2023 home screen (as critiqued) is a counter-example to a purely form-first design: it opens on a category chooser plus promo tiles, and the student critique complains precisely about the missing immediate search entry.

### Gaps
- No authoritative first-launch walkthrough found for: Google Search app, Google Flights mobile, Booking.com, Hopper (current), ChatGPT mobile (current), Perplexity (official), Airbnb (current), Spotify (2024-2026), Uber (2024-2026 home layout). All would need a fresh-install check.
- Mobbin and Page Flows pages were not retrieved (not surfaced by search); they would be the best source of screen-by-screen captures with dates.

## How does each product defer or avoid sign-in?

### Takeaway
The dominant pattern is "sign in at the moment it unlocks something": saving, alerts, booking, history, or progress. The research consensus (NN/g, Baymard) says forcing registration before value is costly. Counter-pressure comes from products whose value requires identity (Uber payment/rider safety, Spotify personalization).

### Cited Findings
- NN/g (Budiu, 2 Mar 2014): login walls impose high interaction cost; they are justified only where users clearly benefit (personal email, banking) and are a nuisance on rarely-visited sites; show content before login (NN/g says it has recommended this since 1999); examples: Gilt lets users browse and requires login only at purchase, TaskRabbit gated listings, Yelp's tablet app buried the no-login option two layers deep, Amazon had no guest checkout (as of 2014). Note this is 12 years old, but it is the standard citation. — [NN/g, Login Walls Stop Users in Their Tracks](https://www.nngroup.com/articles/login-walls/)
- Baymard: in a survey of 1,026 US online shoppers, 19% (some Baymard pages say 18%) said they had abandoned an order because they did not want to create an account; guest checkout only helps if visible, and 62% of benchmarked sites failed to make it the most prominent option. Cite carefully: Amazon Pay's blog misdescribes the same 19% as forgotten passwords. — [Baymard, Reduce Cart Abandonment](https://baymard.com/blog/reduce-cart-abandonment), [Baymard, Current State of Checkout UX](https://baymard.com/blog/current-state-of-checkout-ux); contradicted (framing) by [Amazon Pay blog](https://pay.amazon.com/blog/the-baymard-report-series-how-forcing-sign-ups-drives-down-sales)
- Duolingo: lets users do lessons without an account and escalates sign-up prompts from dismissible to blocking. — [Appcues / Really Good UX](https://goodux.appcues.com/blog/duolingo-user-onboarding), [Heartcore Substack (secondary, describes soft walls after ~3 prompts)](https://heartcore.substack.com/p/heartcore-consumer-insights--7eb)
- Skyscanner: its own Google Smart Lock case study (data window Nov 2015 to Mar 2016, as relayed by a search summary) says price alerts require sign-in, that many users abandoned at the sign-in screen, and that Smart Lock users were 3.8x more likely to create a price alert. A Facebook case study says Skyscanner used first-launch-to-search cohort analysis to refine onboarding messages and doubled Facebook logins. Both are old and vendor-authored case studies (the vendors benefit from the result). — [Google Smart Lock case study PDF](https://developers.google.cn/static/identity/casestudies/skyscanner-smartlock-casestudy.pdf), [Facebook success story](https://developers.facebook.com/success-stories/skyscanner) (the PDF could not be text-extracted by my tool; figures come from a search summary, not verified in the document)
- Skyscanner (undated app update coverage): recent searches sit on the home screen and sync across platforms only if the user is signed in. — [FutureFive](https://futurefive.co.nz/story/skyscanner-releases-improved-version-flights-app) (search snippet; date unknown, probably pre-2020)
- Hopper: a third-party guide says sign-in is prompted after a flight is selected, not on first launch; users are auto-set to "watching" a searched trip and can untoggle it. A separate reviewer reading a screen recording says sign-in is framed as enabling price watching. — [Going.com guide](https://going.com/guides/how-to-use-hopper) (search summary only; undated, may be outdated)
- Kayak: passkey write-up (Google, Oct 2023) says users are offered a passkey at registration and sign in about 50% faster with passkeys. This is about reducing the cost of sign-in, not deferring it. — [Google Developers Blog, Oct 2023](https://developers.googleblog.com/2023/10/how-kayak-reduced-sign-in-time-and-improved-security-with-passkeys.html)
- Booking.com: third-party guides say an account is not required to search, and sign-in mainly affects Genius discounts and loyalty credit; these are older US-focused guides and the current in-app prompt is UNVERIFIED. — [Search summary of ShopBack / Your.Rentals / Giga guides, e.g. Giga](https://www.giga.de/artikel/booking.com-genius-was-ist-das-was-sind-die-vorteile/)
- Airbnb (2012): reviews of the original apps say listings could be browsed without registering and booking required login. This is 14 years old and not evidence of current behaviour. — [Pocketables, Jan 2012](https://pocketables.com/2012/01/airbnb-can-help-you-find-somewhere-to-stay-tonight-wherever-you-are.html), [Android Police, Jan 2012](https://www.androidpolice.com/2012/01/17/new-app-airbnb-debuts-official-android-app-search-and-book-over-19000-unique-accommodations-instantly/)
- ChatGPT: OpenAI's help article says logged-out users get one conversation at a time, no saved history, and cannot continue a conversation after leaving; chats can be saved only by logging in. Android Authority (May 2024, beta) reported the Android app got a no-account mode that was limited. OpenAI's article is about web; whether the iOS/Android app today opens straight to a logged-out chat is UNVERIFIED. — [OpenAI Help: ChatGPT home page](https://help.openai.com/en/articles/9125172), [Android Authority, May 2024](https://androidauthority.com/use-chatgpt-without-account-mobile-3444803)
- Perplexity: see above; guest use, with sign-in nudged after the first use (third-party sources only).
- Duolingo's own growth lead: the delayed sign-up test is "A/B Test #1" in the First Round Review interview with Gina Gotthilf; the 20% DAU lift quote ("simply moving the sign-up screen back a few steps") is quoted by Taplytics from that interview. I could not read the full interview text, and Gotthilf says the original delayed sign-up test predates her tenure (she joined in 2013). — [First Round Review](https://review.firstround.com/articles/gina-gotthilf/), [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding) (Taplytics page failed to fetch for me; quote comes from a search summary)

### Inferences
- Inference: for travel metasearch (Google Flights, Skyscanner, Kayak, Hopper) the account is only needed for stored state (alerts, saved trips, price tracking), so sign-in can sit behind "Save / Track / Alert" actions, which matches the Skyscanner price-alert case study.
- Inference: a skippable sign-in screen at first launch (Kayak as captured) is a hybrid: the value pitch is shown but friction is optional; it costs one screen of delay.

### Gaps
- No primary evidence on Uber's current sign-up order (guides conflict on phone/email/password; flows vary by region).
- No official source on Booking.com, Airbnb or Hopper guest browsing in the current apps.
- Original First Round Review text and Duolingo's own data on delayed sign-up could not be read.

## What does the product put on the home screen besides the core action, and what is the rationale?

### Takeaway
Supporting content falls into three kinds: shortcuts to repeat the action (Uber destinations, recent searches), inspiration/deals (Skyscanner, Google Flights Explore, Airbnb Explore, Google Discover), and cross-sell categories (Skyscanner/Hopper Stays-Flights-Cars, Airbnb Homes-Experiences-Services). Published rationale is thin; mostly company launch statements, not experiment results.

### Cited Findings
- Uber 2016: predicted destination shortcuts, with calendar integration planned. — [Uber newsroom](https://www.uber.com/us/en/newsroom/newriderapp/)
- Google Flights (2014 official blog): Explore map with city photos and price variation by holiday/day/season; "I'm Feeling Lucky" button; its most popular features moved into the main Flight Search. — [Google Travel Blog, June 2014](https://travel.googleblog.com/2014/06/)
- Google Flights (2019): homepage has a search box with a map of suggested trips and "Explore destinations" at the bottom. — [9to5Google, 7 Mar 2019](https://9to5google.com/2019/03/07/google-flights-material-theme/)
- Google Flights (PhocusWire, undated in my results): a later homepage added, under the search box, filter chips (interests such as adventure, culture, ecotourism) that return photo-heavy suggestions. Date and whether still live are UNVERIFIED (direct fetch returned 403). — [PhocusWire](https://www.phocuswire.com/Google-Flights-now-pushes-flexible-destination-search-aiming-at-trip-inspiration)
- Google Flights Explore is reached by leaving the destination blank or going to flights.google.com/explore; filters include duration, stops, airlines, bags. — [Thrifty Traveler guide](https://thriftytraveler.com/guides/google-flights/explore/) (search summary)
- Skyscanner: recent searches at the bottom of the home screen (older update); "Everywhere" destination option sorted by price; Drops launched in the app in March/April 2025 (flags price drops of 20% or more to anywhere); 2023 home screen with promo tiles. — [FutureFive](https://futurefive.co.nz/story/skyscanner-releases-improved-version-flights-app), [Apptopia listing](https://apptopia.com/unified/app/8080872791/about), [IXD@Pratt](https://ixd.prattsi.org/2023/09/design-critique-skyscanner-android-mobile-app/)
- Skyscanner (30 Jun 2026): beta "Explore with AI" on the website lets travellers describe a trip in natural language and compares destinations by price, weather and style; the company reports that in early testing 60% of users clicked through to flight options from these searches. Also a road trip planner, Drops "up to 822% more daily deals", and Stays now over five million properties. This is company-reported, early-test, and website-only. — [Travolution, 30 Jun 2026](https://www.travolution.com/news/travel-sectors/intermediaries/ai-discovery-among-new-skyscanner-product-releases/)
- Hopper (ScreensDesign): home screen dense with category cards, rewards, social-impact element and recent searches; reviewer suggests simplifying for new users. This is the reviewer's opinion. — [ScreensDesign](https://screensdesign.com/showcase/hopper-flights-hotels-cars)
- Hopper's core model: price prediction needs dates selected first, so the prediction sits behind a search, not behind sign-in. — [Going.com guide](https://going.com/guides/how-to-use-hopper); older context: [TravelPulse](https://www.travelpulse.com/news/technology/new-hopper-app-predicts-airfare-prices-alerts-when-to-book) (company claims on accuracy not verified)
- Airbnb 2025: Explore is an "all-new homepage" for discovery of homes, experiences and services; stated rationale is convenience ("all in one place"). — [Airbnb newsroom](https://news.airbnb.com/product-releases/airbnb-2025-summer-release/)
- Spotify: personalised home built from taste selections. — [Spotify Newsroom, 2018](https://newsroom.spotify.com/tag/taste-onboarding/)
- Google Maps 2024: shorter three-tab bottom bar to give more map space. — [9to5Google](https://9to5google.com/2024/07/31/google-maps-bottom-bar-redesign-rolling-out/)
- Google mobile homepage: Discover feed immediately below the search bar (reported). — [PR Daily](https://prdaily.com/?p=254846)

### Inferences
- Inference: no source found gives experiment data on recent-searches or deals modules on the home screen. Their presence is explained by launch statements ("convenience", "inspiration") only.
- Inference: Skyscanner's 60% click-through stat measures the beta tool's own users, not a comparison against a plain search form, so it says little about whether inspiration beats a form.

### Gaps
- No A/B test data located for any of: recent-search modules, deal feeds on the home screen, or form-versus-inspiration layouts.
- Booking.com and Kayak home-screen content: nothing authoritative retrieved.
- Mobbin, Growth.design, UserOnboard teardowns not retrieved for these products.

## Published evidence (A/B tests, case studies, research) on activation, conversion or abandonment

### Takeaway
Hard numbers are few and mostly old or vendor-authored: Duolingo's ~20% DAU lift from delayed sign-up, Baymard's 18 to 19% abandonment from forced account creation, and Skyscanner's 3.8x Smart Lock price-alert effect. None directly compares search-first against feed-first for travel.

### Cited Findings
- Duolingo delayed sign-up: about +20% DAU (interview quote, unverifiable sample/design). — [First Round Review](https://review.firstround.com/articles/gina-gotthilf/) via [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding)
- Duolingo: Appcues cites completion bias and goal-gradient effect as explanations but provides no stats on the page. — [Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding)
- Baymard: 19% (or 18%) of surveyed shoppers abandoned an order because they did not want to create an account. This is self-reported survey data, and it is e-commerce checkout, not app first launch. — [Baymard](https://baymard.com/blog/reduce-cart-abandonment)
- Skyscanner Smart Lock: 3.8x higher price-alert creation among users who signed in via Smart Lock (Nov 2015 to Mar 2016 per summary). Selection bias is possible, since users with saved credentials may be more engaged. — [Google case study](https://developers.google.cn/static/identity/casestudies/skyscanner-smartlock-casestudy.pdf)
- Kayak passkeys: sign-in about 50% faster. — [Google Developers Blog](https://developers.googleblog.com/2023/10/how-kayak-reduced-sign-in-time-and-improved-security-with-passkeys.html)
- NN/g: people usually leave rather than climb a login wall; preview tours often too vague to convey value. — [NN/g](https://www.nngroup.com/articles/login-walls/)
- Appcues cited figure that Duolingo converts about 8.9% of free users to paid (versus about 2% norm) was relayed by a secondary summary and is not tied to a primary source; it also reflects a whole system, not delayed sign-up alone. — [Appcues roundup](https://www.appcues.com/blog/the-10-best-user-onboarding-experiences) (not opened)

### Inferences
- Inference: the weight of evidence supports "value before registration", but the strongest figures are from consumer-subscription and e-commerce, so transfer to a metasearch app is by analogy.
- Inference: Spotify's taste quiz shows the opposite: asking early is acceptable when the questions visibly improve what you see next. No published activation data was found for it.

### Gaps
- No Baymard or NN/g study specific to travel apps' first screen was found.
- No published data on how many Skyscanner/Kayak/Hopper users convert after search vs. at sign-in today.

## Search-first versus browse/feed-first by category, and why

### Takeaway
Category drives the answer: intent-driven tools (transport, AI assistant, metasearch) open on an input; taste- or discovery-driven products (media, marketplace with inspirational browsing) open on content. Travel sits in between and most players hedge with a form plus inspiration modules.

### Cited Findings
- Transport: Uber chose destination-first in 2016 (official). — [Uber newsroom](https://www.uber.com/us/en/newsroom/newriderapp/). By 2019 coverage describes a grid of services as the first port of call. — [It's Nice That](https://www.itsnicethat.com/news/uber-redesign-digital-270919) (snippet-level)
- AI assistant: ChatGPT logged-out and Perplexity guest use both put the prompt first and gate persistence (history, Pro features) behind sign-in (see above for source quality).
- Media: Spotify asks for taste inputs, then opens on a personalised feed. — [Spotify Newsroom](https://newsroom.spotify.com/tag/taste-onboarding/)
- Marketplace/travel stay: Airbnb's 2025 redesign makes Explore a discovery homepage across homes, experiences and services. — [Airbnb newsroom](https://news.airbnb.com/product-releases/airbnb-2025-summer-release/)
- Search engine: Google's mobile homepage reported to place Discover below the search bar. — [PR Daily](https://prdaily.com/?p=254846)
- Maps: map plus a search bar at the top; Explore tab retained in the 2024 three-tab bar. — [9to5Google](https://9to5google.com/2024/07/31/google-maps-bottom-bar-redesign-rolling-out/)

### Inferences
- Inference: the pattern "input on top, feed below" (Google mobile with Discover, Google Flights with Explore map, Skyscanner with Explore/Drops) is the common hedge for products that have both a stated-intent audience and a browsing audience. Evidence is descriptive, not experimental.
- Inference: Uber's move from destination-only to a service grid is consistent with broader product scope forcing a chooser; this is my reading, not an Uber statement.

### Gaps
- No source found that explicitly articulates a category-based rule for "search-first vs feed-first". This synthesis is mine.

## Travel specifically: Google Flights, Skyscanner, Kayak, Hopper — form versus inspiration

### Takeaway
All four keep a search entry plus inspiration in some form. Google Flights is the most documented: search box on top, Explore map and suggestion chips below, with Explore reachable by leaving the destination blank. Skyscanner leans on "Everywhere", Drops and (2026, beta) natural-language Explore with AI; its 2023 home screen drew criticism for lacking an immediate search field. Hopper emphasises watching/predicting prices and a dense home. Kayak evidence is weakest.

### Cited Findings
- Google Flights: Explore launched as an experiment (2013) and was folded into Flight Search in 2014; later homepages show a map of suggested trips below search (2019) and, in a later undated version, interest chips. Blank destination triggers Explore. — [Google Travel Blog 2014](https://travel.googleblog.com/2014/06/), [9to5Google 2019](https://9to5google.com/2019/03/07/google-flights-material-theme/), [PhocusWire](https://www.phocuswire.com/Google-Flights-now-pushes-flexible-destination-search-aiming-at-trip-inspiration), [Thrifty Traveler](https://thriftytraveler.com/guides/google-flights/explore/)
- Skyscanner: home = Explore screen with service chooser and promo tiles; critique says search is not conspicuous. Product direction in 2026 toward AI-led discovery plus Drops (price-drop feed). — [IXD@Pratt, 2023](https://ixd.prattsi.org/2023/09/design-critique-skyscanner-android-mobile-app/), [Travolution, 30 Jun 2026](https://www.travolution.com/news/travel-sectors/intermediaries/ai-discovery-among-new-skyscanner-product-releases/)
- Skyscanner also launched an app inside ChatGPT (2026, UK/US), per trade coverage: a shift toward conversational entry. — [Travolution](https://www.travolution.com/news/travel-sectors/intermediaries/skyscanner-launches-app-in-chatgpt-for-uk-and-us/) (headline seen only; not opened)
- Hopper: value pitch is price notifications and prediction; dense home with recent searches, category cards and rewards; prediction requires dates. — [ScreensDesign](https://screensdesign.com/showcase/hopper-flights-hotels-cars), [Going.com](https://going.com/guides/how-to-use-hopper)
- Kayak: skippable sign-in pitching private deals, alerts and synced plans in one captured version; home layout UNVERIFIED. — [Lazyweb capture](https://www.lazyweb.com/canvas/flows/kayak/sign-in-with-google)

### Inferences
- Inference: the hedging is probably because flexible-destination travellers are a large share of leisure demand; this is not stated in any source I retrieved.
- Inference for the Afar app (my project context, not from sources): a search form on top with a small deals/inspiration strip below and sign-in only at Save/Alert/Book matches the documented Google Flights/Skyscanner pattern and the NN/g/Baymard guidance.

### Gaps
- No A/B or analytics evidence for search-vs-inspiration on any of the four.
- Kayak home layout and Hopper current onboarding unverified.
- Skyscanner current (2025 to 2026) mobile first screen and sign-in prompt not documented in retrieved sources.
- Booking.com, ChatGPT mobile first-launch, Google Search app first-launch, Spotify current flow: not verifiable here; check on device.
