# UX psychology principles behind a "core-action-first" first screen: what each claims, and how strong the evidence is

Evidence tags: [strong evidence] = replicated and/or meta-analysed; [moderate] = solid primary studies, but limited replication, narrow scope or contested; [weak/heuristic] = practitioner heuristic or mostly anecdotal; [unverified] = I could not confirm the detail this session.

Provenance note. Items marked "(fetched/searched this session)" were checked against search or fetch output in this research run. Items marked "(background knowledge)" come from my training knowledge and were NOT re-fetched. Their citations are given in full but should be spot-checked before they go into a final report. Several search results were secondary summaries. Where a number comes only from a secondary summary, I say so.

## KQ1. Principle by principle: what is the strongest primary evidence, and what are the caveats?

### Takeaway
Of the listed principles, only a handful are well-replicated in the form usually cited: Fitts's law (motor pointing), the anchoring effect, the default effect (on average, with large heterogeneity) and the peak-end effect (with the caveat that a plain average predicts about as well). Several widely used "laws" are narrower than their popular versions. Hick's law covers choice reaction time, not "fewer options is always better". Choice overload has a near-zero mean effect and appears only under moderators. Loss aversion is contested between "about 2x on average" and "not general". The Zeigarnik memory effect failed to hold up in a 2025 meta-analysis. Jakob's law, progressive disclosure, time-to-value and "activation" are practitioner heuristics with little or no direct experimental support.

### Cited Findings

#### A. Choice and complexity principles

**Hick's law (Hick–Hyman law)**
- Origin: Hick (1952) had subjects press keys in response to lights, with 1–10 alternatives. Reaction time rose with the log of the number of alternatives, commonly written RT = a + b·log2(n+1). Hyman (1953) extended it to unequal probabilities (RT proportional to stimulus entropy). Scope is choice reaction time for equiprobable, practised stimulus-response mappings. [strong evidence for that narrow scope] — [Hick 1952, Q J Exp Psychol 4(1):11–26](https://doi.org/10.1080/17470215208416600); [Hyman 1953, J Exp Psychol 45(3):188–196](https://doi.org/10.1037/h0056940) (fetched/searched this session, via Wikipedia and summaries: https://en.wikipedia.org/wiki/Hick%27s_law)
- Critique for HCI: Liu, Gori, Rioul, Beaudouin-Lafon & Guiard (CHI 2020), "How Relevant is Hick's Law for HCI?", conclude that logarithmic growth in observed data is not necessarily interpretable via Hick's law. For interface design, studying visual search and decision making is more fruitful than citing the law. [moderate; peer-reviewed critique] — [Liu et al. 2020](https://researchportal.ip-paris.fr/en/publications/how-relevant-is-hicks-law-for-hci/)
- Stimulus and response uncertainty were confounded in the original work and many follow-ups. One later study found response uncertainty accounts for most of the effect for visual stimuli mapped to vocal responses. I did not retrieve the citation, so the study is [unverified] — reported in search summary of https://en.wikipedia.org/wiki/Hick%27s_law
- Menu structure: in randomly ordered menus, scanning is serial, so the log law does not apply. Ordered or categorised lists allow logarithmic search. [weak/heuristic; from a lecture-note source] — https://faculty.ksu.edu.sa/sites/default/files/2_chapter_3_information_processing_-_part_3_-_hick_hyman_law_ams_feb16_16.pdf
- Related, not retrieved (background knowledge): the broad-versus-deep menu literature (e.g. Miller 1981, Kiger 1984, Larson & Czerwinski 1998 CHI) generally found shallow, broad structures faster than deep ones. That is evidence about navigation structure, not "fewer items on one screen".
- Implication: Hick's law supports "fewer equally-likely, unfamiliar choices means faster decisions". It does not show that fewer options increase conversion, satisfaction or retention.

**Choice overload / paradox of choice**
- Original: Iyengar & Lepper (2000), supermarket jam tasting. In the report I recall, a 24-jam table drew more stops than a 6-jam table, but about 3% of the 24-jam visitors bought versus about 30% of the 6-jam visitors. Single store and single product category. [moderate: influential, not cleanly replicated] — [Iyengar & Lepper 2000, JPSP 79(6):995–1006](https://doi.org/10.1037/0022-3514.79.6.995) (background knowledge; figures not re-fetched, [unverified])
- Meta-analysis 1: Scheibehenne, Greifeneder & Todd (2010, J Consumer Research): 63 conditions from 50 published and unpublished experiments, N = 5,036. The mean effect is "virtually zero" with considerable between-study variance. The authors name "several potentially important preconditions" but no sufficient conditions. [strong evidence that the average effect is ~0; moderators uncertain] — [Scheibehenne et al. 2010](https://academic.oup.com/jcr/article/37/3/409/1840020) (fetched this session; abstract only, full text paywalled)
- Meta-analysis 2: Chernev, Böckenholt & Goodman (2015, J Consumer Psychology 25(2):333–358). 99 observations from 53 published studies, combined N = 7,202 (figures from a secondary interview summary). Four moderators: choice-set complexity, decision-task difficulty, preference uncertainty, and the decision goal (effort minimisation). With moderators accounted for, the overall assortment-size effect is reported as significant. They treat satisfaction/confidence, regret, choice deferral and switching likelihood as interchangeable measures. I could not retrieve the pooled effect size. [moderate] — [Kellogg summary of Chernev et al. 2015](https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual); [Scheibehenne et al. reply (2011) to the moderator critique](https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.reply.2011.pdf)
- The two meta-analyses disagree about whether a single average effect is meaningful. Chernev et al. (2010) criticised the 2010 paper as "apples with oranges". Scheibehenne's reply addresses that. [debate unresolved] — same Scheibehenne reply link above.
- Implication: "too many options hurts" is conditional (high complexity, high difficulty, unclear preferences, no clear goal). Choice overload is not a safe general law. A travel search with users who hold a clear goal (known destination) is the low-risk case. An undecided browser ("anywhere, cheapest") is closer to the high-risk case. That is my inference.

**Cognitive load theory / extraneous load**
- Origin: Sweller (1988), "Cognitive load during problem solving", Cognitive Science 12:257–285. CLT is an instructional-design theory about learning, built around limited working memory and intrinsic/extraneous/germane load. The strongest empirical record is in instructional experiments (worked examples, split-attention, redundancy). [strong evidence in education research; moderate when transferred to app UI] (background knowledge)
- Expertise reversal: techniques that help novices can lose effectiveness or backfire for more experienced learners (Kalyuga). [moderate] — [Kalyuga 2007, Educ Psychol Rev](https://link.springer.com/article/10.1007/s10648-007-9054-3) (search result this session)
- Critique: de Jong (2010) raises conceptual and methodological problems. Load components are hard to measure separately. Germane load is argued to be a post-hoc explanation. Findings are inconsistent. [moderate; contested theory] — [de Jong 2010, Instructional Science](https://link.springer.com/article/10.1007/s11251-009-9113-x) (search result this session)
- Implication: "reduce extraneous load" is sound as a design intuition. As a quantified theory of what makes a home screen convert, it is weakly tested, and the load types are not independently measurable.

**Progressive disclosure**
- Defers advanced or rarely used features to a secondary screen so apps are easier to learn and less error-prone (attributed to Nielsen, 1995). [weak/heuristic] — via secondary sources: https://en.wikipedia.org/wiki/Progressive_disclosure; NN/g article nngroup.com/articles/progressive-disclosure/ (not fetched this session)
- Related lab evidence is the "training wheels" interface (Carroll & Carrithers 1984, CACM 27(8):800–806), which blocked advanced functions for novices. A secondary summary notes that empirical evidence for progressive disclosure per se is limited. [moderate for training wheels in the lab; weak for the general pattern] (background knowledge, plus the secondary note in the search result)
- Implication: this supports hiding secondary controls, but does not itself say which action should be primary. That is a design decision.

#### B. Familiarity, motor and attention

**Fitts's law**
- Fitts (1954) formalised movement time as MT = a + b·log2(2D/W). MacKenzie (1992, Human-Computer Interaction 7:91–139) popularised the Shannon form log2(D/W + 1) and throughput as a speed-accuracy measure, later standardised in ISO 9241-9. [strong evidence for pointing tasks] — [Fitts 1954](https://doi.org/10.1037/h0055392); [MacKenzie 1992](https://doi.org/10.1207/s15327051hci0701_3); summary in https://www.yorku.ca/mack/HCI.html (searched this session)
- Caveats: it models motor time to acquire a target, not whether the user notices, wants or understands it. The touch literature adds finger-occlusion and thumb-reach effects (I recall Parhi, Karlson & Bederson 2006 on thumb target size, [unverified]). The "larger targets are faster, especially on touchscreens" statement came from a secondary summary only.
- Implication: justifies a large, reachable primary control (search field or CTA). It says nothing about whether the core action should be the first screen.

**Jakob's law**
- Claim: users spend most of their time on other products and expect yours to work the same way. Nielsen (2000) states it has "been proven many times", but I found no single quantified study. [weak/heuristic, though consistent with the mental-model literature] — [Nielsen, Jakob's Law (author's blog)](https://jakobnielsenphd.substack.com/p/jakobs-law); [lawsofux.com/jakobs-law](https://lawsofux.com/jakobs-law/) (pointer only)
- Implication: supports using conventional flight-search patterns. Whether a search form can be the first screen is not decided by it, because many travel apps already open on a search form (my knowledge, unsourced).

**Serial position effect**
- Murdock (1962), J Exp Psychol 64:482–488, studied free recall of word lists: primacy and recency. Glanzer & Cunitz (1966) showed recency is reduced by delay. [strong evidence for list memory] (background knowledge)
- Transfer to UI (put key items first and last in nav/tabs) has no direct support that I found. Menu items are visible, not recalled from a spoken list. [weak/heuristic]
- Implication: loosely relevant. Put the core action in a first or last tab if you wish, but do not cite Murdock as evidence for that.

**First impressions of visual appeal (extra)**
- Lindgaard et al. (2006), "Attention web designers: you have 50 milliseconds to make a good first impression", Behaviour & Information Technology 25(2):115–126. Appeal ratings after ~50 ms correlated highly with ratings after longer exposures. [moderate; small-scale studies; judgment of appeal, not task success] (background knowledge, details [unverified])

#### C. Defaults, ownership and effort

**Default effect**
- Johnson & Goldstein (2003, Science 302:1338–1339) compared organ-donor consent across countries: opt-in countries had consent rates roughly in the single digits to ~28%, opt-out countries ~86–100%. [moderate: real-world but not randomised; consent rate is not actual donation rate] — [doi:10.1126/science.1091721](https://doi.org/10.1126/science.1091721) (background knowledge)
- Madrian & Shea (2001, QJE 116:1149–1187): automatic 401(k) enrolment raised participation from about 37% to about 86% for new hires in one firm. [strong evidence, natural experiment, one firm] (background knowledge; figures [unverified])
- Meta-analysis: Jachimowicz, Duncan, Weber & Johnson (2019, Behavioural Public Policy 3(2):159–186). 58 default studies, pooled n = 73,675, d = 0.68 (95% CI 0.53–0.83). Large heterogeneity: some null, two negative, range approximately −0.5 to 2. Defaults work better in consumer domains and when they signal endorsement or the status quo. They work less well in environmental domains. [strong evidence for an average positive effect; strong caveat on heterogeneity and moderators] — [Jachimowicz et al. 2019](https://collaborate.princeton.edu/en/publications/when-and-why-defaults-influence-decisions-a-meta-analysis-of-defa/); [IDEAS record](https://ideas.repec.org/a/cup/bpubpo/v3y2019i02p159-186_00.html) (searched this session)
- Broader nudge literature: Mertens et al. (2022, PNAS) pooled nudge effect around d = 0.43. Maier et al. (2022, PNAS) found no evidence for nudging after publication-bias correction. This calls the size of the average default/nudge effect into question. [contested] — [Mertens 2022](https://doi.org/10.1073/pnas.2107346118); [Maier 2022](https://doi.org/10.1073/pnas.2200300119) (background knowledge; not fetched)
- Implication: defaults (pre-filled origin, last search, currency) are a legitimate lever, but the evidence concerns choices of options on a form, not whether to show a form first.

**IKEA effect / effort justification**
- Norton, Mochon & Ariely (2012, J Consumer Psychology 22(3):453–460). Four studies (IKEA boxes, origami, Lego). People valued what they built more, but only when the task was completed. If they destroyed or failed to finish the creation, the effect disappeared. Labour raised valuation for DIY enthusiasts and novices alike. [moderate] (fetched/searched this session)
- Conceptual replication: Sarstedt, Neubert & Barth (2017, Journal of Marketing Behavior 2(4)) supported robustness and a psychological-ownership mechanism. [moderate] (secondary summary: https://nowpublishers.com/article/Details/JMB-0039)
- Effort justification: Aronson & Mills (1959, J Abnormal and Social Psychology 59:177–181): severe initiation raised liking for a dull group. I found no direct replication in this session; the dissonance interpretation is debated. [weak to moderate; classic, old, small sample, direct replication not found]
- Implication: relevant only to the idea that letting a user invest effort early (build a search, save a trip) raises attachment. It requires successful completion, which is a risk if the first action is hard. Loosely relevant to first-screen layout.

**Anchoring**
- Tversky & Kahneman (1974, Science 185:1124–1131). Replication: the anchoring effect was among the effects that replicated robustly in Many Labs 1 (Klein et al. 2014, Social Psychology 45(3):142–152). Many Labs 2 (Klein et al. 2018, AMPPS; 28 findings, ~15,000 participants, 36 countries/territories) replicated 15 of 28 (54%) at p < .05. A specific incidental-anchor sales-estimate study failed there (d = 0.04 vs original 0.30). [strong evidence for classic numeric anchoring; weak for incidental/environmental anchors] — [Klein et al. 2018](https://journals.sagepub.com/doi/10.1177/2515245918810225); [FORRT replication atlas entry](https://forrt.org/flora-replication-atlas/doi/10.1002/bdm.586/) (searched this session). The Many Labs 1 claim is from my background knowledge plus a secondary blog analysis (https://www.lesswrong.com/posts/eXwpbnSeRHTahvJAx/is-anchoring-a-reliable-cognitive-bias), so [moderate] on provenance.
- Implication: relevant to price display (showing "from $X"), not to whether the first screen is a search field.

#### D. Motivation and progress

**Goal-gradient effect**
- Origin: Hull (1932, 1934) with rats. Kivetz, Urminsky & Zheng (2006, J Marketing Research 43(1):39–58) found café customers bought coffee more frequently the closer they were to a free coffee. [moderate: field data from a loyalty programme, limited replication found] — [Columbia Business School record](https://business.columbia.edu/faculty/research/goal-gradient-hypothesis-resurrected-purchase-acceleration-illusionary-goal) (searched this session)

**Endowed progress**
- Nunes & Drèze (2006, J Consumer Research 32(4):504–512). At a car wash, 300 loyalty cards. 8-stamp cards with 0 stamps versus 10-stamp cards with 2 free stamps (both needing 8 purchases). Over nine months 34% of the pre-stamped group redeemed versus 19%. The effect is stronger when a reason is given for the endowment. [moderate: one field experiment, no direct replication found this session] — [IDEAS record](https://ideas.repec.org/a/oup/jconrs/v32y2006i4p504-512.html); [Wharton summary](https://knowledge.wharton.upenn.edu/?p=5630) (searched this session)
- Kivetz et al. (2006) used the same artificial-advancement idea with 12-stamp coffee cards that had 2 bonus stamps. Some practitioner pages misattribute this and inflate the car-wash effect (one claims 82%; the paper's numbers imply about a 79% relative increase). [caution on secondary sources] — same searched sources.
- Implication: relevant to onboarding checklists and profile-completion bars, not to first-screen layout. Only applicable once there is a multi-step goal.

**Zeigarnik effect**
- Zeigarnik (1927, Psychologische Forschung 9:1–85) reported better memory for interrupted than completed tasks. Ovsiankina (1928) described the tendency to resume interrupted tasks.
- Ghibellini & Meier (2025, Humanities and Social Sciences Communications, doi:10.1057/s41599-025-05000-w) meta-analysis (University of Bern): no memory advantage for unfinished tasks; interrupted/completed recall ratio ≈ 0.99 per a secondary summary; but a general tendency to resume (Ovsiankina effect), reported at ~67% against a 50% baseline. Reported study counts conflict between summaries (59 vs 37), and overall d = 0.15 appears in one summary only. Earlier replication failures include Van Bergen (1968). The authors suggest context changes (experimenter authority, task involvement) as an explanation. [strong evidence that the memory effect is not robust; moderate for the resumption tendency] — [IDEAS record](https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html); [Bern thesis](https://boristheses.unibe.ch/4796/); [Wikipedia summary](https://wiki.pingponghomelab.duckdns.org/content/wikipedia_en_all_nopic_2026-03/Zeigarnik_effect) (searched this session; study counts [unverified])
- Implication: do not use "unfinished tasks are remembered" to justify cliffhanger onboarding or "resume your search" prompts. The resumption tendency (Ovsiankina) is the better-supported fact, and it concerns acting, not remembering.

**Peak-end rule**
- Origin: Kahneman, Fredrickson, Schreiber & Redelmeier (1993, Psychological Science 4(6):401-405): cold-water trial where a longer, slightly less painful ending was preferred for repetition. Small lab sample. [moderate for original] (background knowledge)
- Meta-analysis: Alaybek, Dalal et al. (2022, Organizational Behavior and Human Decision Processes 170): 174 effect sizes; peak-end effect r = 0.581 (95% CI 0.487–0.661); duration had essentially no effect (duration neglect); but peak-end predicted evaluations about as well as the plain overall average, and it beat trend, variability, first and trough episodes. [strong evidence that retrospective evaluation tracks peak and end; but not that it beats the average] — [IDEAS record](https://ideas.repec.org/a/eee/jobhdp/v170y2022ics0749597822000334.html); [GMU dissertation page](https://psychology.gmu.edu/defenses/1259) (searched this session)
- Implication: the first screen is neither the peak nor the end of an experience, so the rule is only loosely relevant. It bears on the booking-confirmation moment and on avoiding a painful ending.

**Loss aversion**
- Origin: Kahneman & Tversky (1979), Econometrica 47:263–291. Popular claim: losses loom about twice as large as gains.
- Support: Brown, Imai, Vieider & Camerer (2024, Journal of Economic Literature 62(2):485–516): 607 estimates from 150 articles (1992–2017), mean loss-aversion coefficient 1.955 (95% interval 1.820–2.102), with few study-design characteristics explaining variation. [strong evidence in risky-choice elicitation] — [JEL page](https://www.aeaweb.org/doi/10.1257/jel.20221698) (searched this session)
- Critique: Gal & Rucker (2018, J Consumer Psychology) argue evidence does not show losses are generally more impactful than gains. The strong version is a straw man, and loss aversion is over-generalised and context-dependent. Yechiam's work argues loss aversion does not emerge for small-to-moderate losses (Yechiam, Psychological Research, 2018/2019). Walasek, Mullett & Stewart (2018) report mean λ of 1.31, versus 1.955 above, attributed to different literatures and task types. [contested] — [Gal & Rucker SSRN](https://papers.ssrn.com/abstract=3049660); [Yechiam PDF](https://www.Gwern.net/doc/statistics/bias/2018-yechiam.pdf); [commentary on the 1.955 vs 1.31 gap](https://ideas.repec.org/a/eee/joepsy/v103y2024ics0167487024000485.html) (searched this session). A defence of loss aversion (Mrkva, Johnson, Gächter & Herrmann 2020, J Consumer Psychology) I recall but did not retrieve: [unverified].
- Implication: "framing a sign-up wall as loss" or "you'll lose your saved deals" is not a free lunch. Effects are context-specific and typically small for small stakes. A free flight search has small stakes.

#### E. Control, trust and first-use behaviour

**Perceived control, autonomy, locus of control**
- Leotti, Iyengar & Ochsner (2010, Trends in Cognitive Sciences 14(10):457–463) review animal, clinical and neuroimaging work and argue that the perception of control is a psychological and biological necessity. They propose opportunities to exercise control foster self-efficacy. [moderate: narrative review] — [PMC2944661](https://pmc.ncbi.nlm.nih.gov/articles/PMC2944661) (searched this session)
- Background (not fetched): Rotter (1966, locus of control); Langer (1975, JPSP 32:311–328, illusion of control: people valued self-chosen lottery tickets more); Ryan & Deci (2000, American Psychologist 55:68–78, self-determination theory). Replication status of Langer's specific numbers: [unverified].
- Implication: supports letting the user start the task themselves instead of being walked through a tour. It does not directly test first-screen layouts, so the inference is mine. Control is a plausible mechanism, not a demonstrated effect on app activation.

**Paradox of the active user / first-use behaviour**
- Carroll & Rosson (1987), "Paradox of the active user", in Carroll (ed.), Interfacing Thought, MIT Press: users at IBM began using software immediately and skipped manuals, even when learning first would have saved time later. [moderate: observational, 1980s office-software studies] — [NN/g summary](https://www.nngroup.com/articles/paradox-of-the-active-user/); [lawsofux pointer](https://lawsofux.com/paradox-of-the-active-user) (searched this session)
- Rettig (1991), "Nobody reads documentation", CACM 34(7):19–24 (background knowledge, [unverified]).
- Minimalism: Carroll (1990), The Nurnberg Funnel, MIT Press. Design instruction around real tasks users can start immediately. A secondary summary reports 25 cards replacing a 94-page manual and users learning the task in about half the time, with faster completion, fewer dependent errors and better transfer. The numbers come from secondary summaries only. [moderate for 1980s lab context] — [Instructional Design summary](https://www.instructionaldesign.org/theories/minimalism/); [AURA lab summary](https://aura-lab.siue.edu/theories/minimalism/) (searched this session)
- Implication: the most direct support for "open on the core action". Users want to act, and instruction works best when attached to real tasks. Caveat: evidence is from pre-mobile desktop software and workplace learners.

#### F. Others bearing on the first screen
- Information foraging / information scent: Pirolli & Card (1999, Psychological Review 106(4):643–675) model users following cues toward goals. [moderate] — background knowledge. Implication: the core action must be recognisable from the first screen.
- Postel's law ("be liberal in what you accept") is a network-robustness principle (RFC 761), not a UX psychology finding. Principle of least surprise is a design heuristic. [weak/heuristic as applied to UX] (background knowledge)
- Time to first value / activation: I found no peer-reviewed or replicated evidence that shortening time to first value raises retention, only vendor and practitioner claims. [weak/heuristic] — not verified this session.
- Google's homepage as proof: no controlled comparison I found. The success is confounded by brand, query volume and a single-field task. [weak/heuristic, anecdote]

### Inferences
- Evidence tiers.
  - (a) Well-replicated empirical findings: Fitts's law for pointing; the anchoring effect (classic numeric); the default effect on average (with heterogeneity); peak-end predicting retrospective evaluation (but no better than the average); the finding that choice overload's mean effect is near zero.
  - (b) Heuristics with weak or anecdotal evidence in UX contexts: Jakob's law, progressive disclosure, serial position applied to menus, time-to-value, Postel's law, and CLT-style claims applied to app screens.
  - (c) Overstated or misquoted: Hick's law as "fewer options = better" or "fewer choices convert"; paradox of choice as a general law (jam study); Zeigarnik as a memory effect; "losses loom 2x" as a universal; endowed progress "82%"; IKEA effect without noting it requires completion.
- Most defensible psychology base for "core-action-first" is a small set (users act first, minimise instruction, control, familiar patterns). Much of the commonly cited list is decorative.

### Gaps
- I could not fetch full texts of the paywalled papers (Scheibehenne 2010, Chernev 2015). Chernev's pooled effect size is missing.
- No direct replication of the car-wash endowed-progress experiment or of Aronson & Mills (1959) found this session.
- Mrkva et al. 2020 (defence of loss aversion) and the Parhi et al. thumb-target study were not verified.
- NN/g's progressive disclosure article was not fetched; only secondary summaries were seen.
- No controlled study comparing a core-action-first versus a menu/landing-first home screen on activation or conversion was found.

## KQ2. Which principles genuinely support "open on the core action", and which are only loosely relevant?

### Takeaway
The principles that bear most directly are paradox of the active user / minimalism, perceived control, and a narrow reading of cognitive load (do not make users read before they act). Defaults, Fitts's law and Jakob's law support how to build the first screen once chosen, not the choice itself. Zeigarnik, peak-end, serial position, anchoring, loss aversion, goal-gradient and IKEA effect are only loosely relevant to this decision.

### Cited Findings
- Direct support (moderate): users start doing and skip instructions (Carroll & Rosson 1987), and minimalist, task-first instruction reportedly beat manuals in 1980s studies — [NN/g](https://www.nngroup.com/articles/paradox-of-the-active-user/); [Instructional Design summary](https://www.instructionaldesign.org/theories/minimalism/)
- Direct support (moderate): perceived control and agency — [Leotti et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2944661)
- Execution support: defaults — [Jachimowicz 2019](https://collaborate.princeton.edu/en/publications/when-and-why-defaults-influence-decisions-a-meta-analysis-of-defa/); Fitts — [MacKenzie 1992](https://doi.org/10.1207/s15327051hci0701_3); familiarity — [Nielsen, Jakob's law](https://jakobnielsenphd.substack.com/p/jakobs-law).
- Hick's law gives only narrow support. NN/g-style sources say serial tips overload and are dismissed; see KQ3 for sources. The law itself covers reaction time to unfamiliar equiprobable choices — [Liu et al. 2020](https://researchportal.ip-paris.fr/en/publications/how-relevant-is-hicks-law-for-hci/)
- Loosely relevant or misapplied: peak-end (first screen is neither peak nor end) — [Alaybek et al. 2022](https://ideas.repec.org/a/eee/jobhdp/v170y2022ics0749597822000334.html); Zeigarnik — [Ghibellini & Meier 2025](https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html); choice overload — [Scheibehenne et al. 2010](https://academic.oup.com/jcr/article/37/3/409/1840020).

### Inferences
- The decision is better framed as "what is the user's task and how many inputs does it need?" Google's one-field search is a poor analogue for a flight search with origin, destination, dates and passengers (my inference). A core-action-first Afar screen should be the search form, with defaults for the fields that can have one.
- If the home screen is deals/inspiration rather than a form, Hick/choice-overload concerns apply to undecided browsers, and Chernev's moderators (preference uncertainty, goal) predict more risk.

### Gaps
- No direct experimental test of core-action-first versus alternatives.
- No travel-specific evidence retrieved (the Baymard material covers e-commerce checkout).

## KQ3. Onboarding tours and walkthroughs versus learning by doing

### Takeaway
Evidence favouring task-first, just-in-time guidance over upfront tours is mostly observational and from design critique. The only experimental support I found is 1980s minimalist-instruction work. Rigorous modern A/B or RCT evidence on onboarding tours was not found in this session.

### Cited Findings
- NN/g (Harley, 2014) on coach marks/instructional overlays: users tend to dismiss them quickly and do not read thoroughly; showing many tips at once overloads working memory (information fades in about 20 seconds); serial tips make users dismiss faster and the app seem complicated; show one hint when the user reaches the relevant point; keep text minimal and visually distinct from the real UI. The page reports no sample sizes or quantitative results. The Wimbledon tablet-study observation (users mistook an overlay for UI) has no participant count. [weak/heuristic, based on design critiques] — [NN/g](https://www.nngroup.com/articles/mobile-instructional-overlay/) (fetched this session)
- Carroll & Rosson (1987) and the minimal manual: users skip instructions; minimalist, task-based material was reported to produce faster learning (secondary summary: 25 cards versus a 94-page manual, about half the time). [moderate; old and secondary] — [Instructional Design summary](https://www.instructionaldesign.org/theories/minimalism/)
- Training wheels (Carroll & Carrithers 1984): hiding advanced functions helped novices succeed (background knowledge); a secondary summary adds that evidence for progressive disclosure generally is limited — [Progressive disclosure, Wikipedia](https://en.wikipedia.org/wiki/Progressive_disclosure)
- Expertise reversal: guidance that helps novices can hurt more experienced users — [Kalyuga 2007](https://link.springer.com/article/10.1007/s10648-007-9054-3)

### Inferences
- A consumer app has mixed expertise and a task (search for a flight) that most users already understand. That makes a tour more likely to be redundant (and, per expertise reversal, possibly harmful for experienced users). A tour can still pay off for novel gestures or features (my inference).
- Best-supported pattern: contextual, dismissible, single-step hints on first encounter, plus a usable core action from the start. The strength of that support is moderate-to-weak.

### Gaps
- No quantitative A/B or RCT data on tours versus no tours was found. Vendor data (Appcues, Userpilot, Mixpanel, etc.) was not searched.
- NN/g's later onboarding research and any academic onboarding studies (e.g. at CHI) were not located.

## KQ4. Registration walls versus deferring sign-up

### Takeaway
Practitioner research strongly and consistently advises against sign-up before value, but the quantitative evidence is survey-based and weak. The cleanest figure is Baymard's: about 19% (later 18%) of US online shoppers said they had abandoned an order because they did not want to create an account. I found no peer-reviewed experiment on registration walls.

### Cited Findings
- NN/g: in their usability testing they have "rarely seen users more annoyed" than at login walls. Costs are cognitive (recall credentials or create an account). Walls are justified only where users clearly benefit (e.g. email, banking). NN/g has recommended against walls at the start of the experience since 1999. Qualitative, no sample sizes in the article. [moderate to weak: expert/qualitative] — [NN/g Login Walls](https://www.nngroup.com/articles/login-walls/); [video](https://www.nngroup.com/videos/login-walls/) (searched this session; the article body was not fetched)
- Baymard Institute: in a survey of 1,026 US adults who shopped online in the previous three months, 19% reported abandoning an order because they did not want to create an account. A later version of the same article says 18%; which is current is unclear. Self-reported reasons, e-commerce checkout, not app first-run. [moderate for checkout] — [Baymard, Current state of checkout UX](https://baymard.com/blog/current-state-of-checkout-ux); [Baymard, Reduce cart abandonment](https://baymard.com/blog/reduce-cart-abandonment) (searched this session; I did not find a 24% figure, which the request had mentioned)
- Other numbers are weaker: a 2011 survey (n = 616, context unclear) found 54% said they might leave or not return — [PasswordResearch.com](https://passwordresearch.com/stats/statistic286.html); a Janrain-sponsored infographic claims 86% "may leave" — [Convince & Convert](https://www.convinceandconvert.com/social-media/infographic-86-percent-of-users-may-leave-a-website-when-asked-to-create-an-account/). A third-party 26% figure (n=4,560) could not be matched to Baymard — [LaunchMyStore blog](https://launchmystore.io/blog/checkout-optimization-frictionless-ecommerce). [weak/heuristic: commercial or unclear method]
- Amazon Pay's summary of a 2017 Baymard report says 37% disliked being forced to create an account (stated preference, not behaviour) — [Amazon Pay blog](https://pay.amazon.com/blog/the-baymard-report-series-how-forcing-sign-ups-drives-down-sales)

### Inferences
- Theory that would predict benefits of deferral: IKEA effect/effort investment, endowed progress, and the foot-in-the-door effect (Freedman & Fraser 1966, JPSP 4:195–202, background knowledge) all suggest value or small commitments first, then the larger ask. This is inference, not tested for sign-up walls in anything I found.
- For Afar: search and browse of hardcoded sample data can run without an account. Sign-in is better placed at saving deals or trips, where there is clear user benefit (consistent with NN/g's "clear benefit" exception).

### Gaps
- No peer-reviewed or A/B evidence on deferred versus upfront registration for mobile apps; the Baymard number is about checkout.
- The 24% figure mentioned in the brief could not be sourced; 19%/18% is what Baymard's pages show.
- Effect of account creation on downstream retention (benefits of early accounts, e.g. re-engagement) was not researched.
