# Curo — Design Audit

*Conducted as a pre-launch review. Scope: UI, UX, IA, interaction, responsiveness, perceived quality. No business logic, API, schema, routing, or validation is touched by any recommendation here.*

---

## Executive summary

Curo is functionally complete and the underlying product is genuinely differentiated — the live slot grid is a real idea, not a skin. But the *presentation* currently undersells it. The app reads as a competent internal tool, not a venture-backed consumer product. The gap is almost entirely surface: hierarchy, motion, density, trust framing, and a hero that shows a stock photo instead of the product.

The good news is that the foundation is strong. There is already a token system, a consistent teal identity, five-state discipline, and tabular figures. We are refining a real design system, not inventing one. That is why this audit is about elevation, not rescue.

---

## 1. Visual design weaknesses

- **The hero sold a photo, not the product.** A stock doctor communicates "healthcare template". Linear, Stripe, Vercel and Attio all lead with a shot of the actual interface. Our single strongest asset — the slot grid — was hidden three clicks deep.
- **Flat surfaces, no depth language.** Cards used one shadow level and one border. Premium products layer elevation deliberately: ambient shadows, subtle ring borders, and the occasional glass surface to signal a floating layer.
- **No gradient or accent system.** Everything was solid fills. A restrained gradient — used once, on the hero and in an accent — reads as designed rather than defaulted.
- **Type hierarchy compressed.** Headlines were bold but not *large* enough relative to body. Awwwards-tier heroes run 56–72px display type; ours sat around 44px with tight leading.

## 2. UX friction points

- **First-time visitors got no story.** The old home page was hero → specialties → done. There was no problem framing, no "why this over Practo", no proof, no FAQ. A visitor could not answer "why should I trust this?" in five seconds.
- **CTA hierarchy was flat.** One teal button repeated. No visual distinction between the primary path (find a doctor) and secondary paths (how it works, for clinics).
- **Loading felt like waiting.** Real skeletons existed on results, but the home and dashboard leaned on spinners or bare server waits. Perceived performance is the cheapest luxury signal and we were leaving it on the table.

## 3. Outdated patterns

- **Marketing-brochure layout** (centered hero, stock photo, feature list) rather than product-demo layout (asymmetric hero, live UI, bento grid).
- **Static everything.** No hover choreography, no scroll reveal, no micro-interaction. Modern SaaS uses motion as a quality signal — subtle, fast, and everywhere.
- **Uniform section rhythm.** Every section was white on white with the same padding. Premium sites alternate surface tone (white → tinted → dark) to create a narrative cadence.

## 4. Conversion bottlenecks

- **No proof near the CTA.** Trust signals and the booking CTA lived in different parts of the page. They belong together.
- **The value prop required reading.** "Book a doctor in sixty seconds" is good copy, but there was nothing *visual* proving the 60 seconds. Showing the grid does the proving.
- **Pricing was unlinked from the story.** A strong pricing page existed but nothing on the home page led a clinic owner toward it.

## 5. Template tells (the "this is a starter" signals)

- Stock hero photo with a floating "trusted by millions" badge — the single most template-coded element on the web.
- Even, undifferentiated card grids.
- No FAQ, no testimonials, no "how it works", no footer sitemap.
- One font weight range, one shadow, one radius personality doing all the work.

## 6. Missing trust signals

- No social proof of any kind.
- No security/rigor framing — yet the product has a genuinely rigorous story (row-level security, a database-enforced no-double-booking guarantee). That is *real* enterprise credibility going unspoken.
- No "built on" strip. Naming Next.js, Supabase, Stripe, Vercel is honest, verifiable credibility — far better than fake customer logos.

## 7. Weak hierarchy

- KPIs, headings and body text sat too close in size.
- Section headers did not announce themselves — no eyebrow labels, no scale jump.
- The primary action did not dominate its screen.

## 8. Mobile experience

- The hero's right column was `hidden lg:block` — mobile users saw copy floating alone with no visual anchor.
- Filter pill rows could overflow without clear affordance.
- Touch targets on slot chips were adequate (44px) — one thing that was already right.

---

## Redesign approach

Following Linear (restraint + speed), Stripe (typographic clarity), Vercel/Geist (systematic minimalism), Attio (dense data made elegant), and Raycast/Arc (motion as delight):

1. **Design system first.** Add depth (layered shadows, ring borders, one glass surface), a single restrained gradient, a scroll-reveal primitive, and refined transitions — all into the generated stylesheet so tokens stay the source of truth.
2. **Product-mockup hero.** Replace the stock photo with a faithful, animated mockup of the real slot grid. Show the product doing its one magic trick above the fold.
3. **A real narrative.** Problem → solution → bento features → how it works → honest social proof → pricing teaser → FAQ → CTA.
4. **Honest trust.** Real tech-stack strip, real DB-driven metrics, clearly-illustrative testimonials marked for replacement, and — the sleeper — surface the database-enforced booking guarantee as the security story.
5. **Mobile-first pass.** Every section reflows; the hero mockup shrinks rather than disappears.

Every change below preserves 100% of functionality, routing, state, API calls, forms and validation. Only presentation changes.
