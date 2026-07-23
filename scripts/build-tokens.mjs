#!/usr/bin/env node
/**
 * tokens.json -> app/globals.css
 *
 * The single source of truth for every colour, space and radius in Curo.
 * Run on `postinstall` and in CI. If a component references a raw hex instead
 * of a var produced here, the lint rule in eslint.config.mjs fails the build.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(resolve(root, "design/tokens.json"), "utf8"));
const { primitives, semantic } = tokens;

/** {color.teal.500} -> #028090 */
const deref = (value) => {
  if (typeof value !== "string" || !value.startsWith("{")) return value;
  const [group, family, step] = value.slice(1, -1).split(".");
  if (group === "color") return primitives.color[family][step];
  return value;
};

const lines = [];
const emit = (s = "") => lines.push(s);

emit("/* GENERATED FROM design/tokens.json — DO NOT EDIT BY HAND. */");
emit('/* Regenerate with `node scripts/build-tokens.mjs`. */');
emit();
emit('@import "tailwindcss";');
emit();

/* ---------- primitives ---------- */
emit(":root {");
for (const [family, steps] of Object.entries(primitives.color))
  for (const [step, hex] of Object.entries(steps)) emit(`  --color-${family}-${step}: ${hex};`);
emit();
for (const [key, val] of Object.entries(primitives.font.size)) emit(`  --text-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.font.weight)) emit(`  --font-weight-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.font.lineHeight)) emit(`  --leading-${key}: ${val};`);
emit(`  --font-sans: ${primitives.font.family.sans};`);
emit(`  --font-mono: ${primitives.font.family.mono};`);
emit(`  --font-feature-tabular: ${primitives.font.feature.tabular};`);
emit();
for (const [key, val] of Object.entries(primitives.space)) emit(`  --space-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.radius)) emit(`  --radius-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.shadow)) emit(`  --shadow-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.motion.duration)) emit(`  --duration-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.motion.easing)) emit(`  --ease-${key}: ${val};`);
for (const [key, val] of Object.entries(primitives.border)) emit(`  --border-${key}: ${val};`);
emit("}");
emit();

/* ---------- semantic ---------- */
const emitSemantic = (mode, selector) => {
  emit(`${selector} {`);
  for (const [group, entries] of Object.entries(semantic[mode]))
    for (const [key, val] of Object.entries(entries)) {
      if (key.startsWith("$")) continue;
      emit(`  --${group}-${key}: ${deref(val)};`);
    }
  emit("}");
  emit();
};

emitSemantic("light", ":root");
emitSemantic("dark", '[data-theme="dark"]');
emit("@media (prefers-color-scheme: dark) {");
emit("  :root:not([data-theme]) {");
for (const [group, entries] of Object.entries(semantic.dark))
  for (const [key, val] of Object.entries(entries)) {
    if (key.startsWith("$")) continue;
    emit(`    --${group}-${key}: ${deref(val)};`);
  }
emit("  }");
emit("}");
emit();

/* ---------- base ---------- */
emit(`@theme inline {
  --color-canvas: var(--bg-canvas);
  --color-surface: var(--bg-surface);
  --color-brand: var(--bg-brand);
  --color-fg: var(--text-primary);
  --color-fg-muted: var(--text-muted);
  --color-border-control: var(--border-control);
}

* { border-color: var(--border-subtle); }

body {
  background: var(--bg-canvas);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
}

/* Every time, fee and count in the product. Digits must not jitter. */
.tabular { font-variant-numeric: tabular-nums; font-feature-settings: var(--font-feature-tabular); }

/* ---------------------------------------------------------------------------
   Type scale — ONE modular scale, used everywhere. Ends the drift of ad-hoc
   rem sizes. Based on the deck's 12·14·16·20·24·32·48 with tuned leading and
   tracking for a restrained, Linear/Stripe-grade hierarchy.
--------------------------------------------------------------------------- */
.t-eyebrow {
  font-size: 0.8125rem; font-weight: 600; line-height: 1.2;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-brand);
}
.t-display {
  font-size: clamp(2.25rem, 1.4rem + 3.4vw, 3rem);
  font-weight: 700; line-height: 1.04; letter-spacing: -0.028em;
  color: var(--text-primary);
}
.t-h1 { font-size: 2rem; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; color: var(--text-primary); }
.t-h2 { font-size: 1.5rem; font-weight: 650; line-height: 1.2; letter-spacing: -0.015em; color: var(--text-primary); }
.t-h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; color: var(--text-primary); }
.t-lead { font-size: 1.125rem; line-height: 1.6; color: var(--text-secondary); }
.t-body { font-size: 1rem; line-height: 1.6; color: var(--text-secondary); }
.t-small { font-size: 0.875rem; line-height: 1.5; color: var(--text-muted); }
.t-micro { font-size: 0.75rem; line-height: 1.4; color: var(--text-muted); }

/* One focus treatment, applied everywhere, never removed. */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---------------------------------------------------------------------------
   Premium layer — depth, glass, gradient, motion.
   Utility classes so components stay declarative and the token vars stay the
   single source of colour. Nothing here changes behaviour.
--------------------------------------------------------------------------- */

/* Layered ambient elevation — softer and deeper than a single drop shadow. */
.shadow-ambient {
  box-shadow:
    0 1px 2px rgb(14 18 20 / 0.04),
    0 8px 24px -8px rgb(14 18 20 / 0.10),
    0 24px 48px -24px rgb(14 18 20 / 0.12);
}

/* A single glass surface for floating layers (nav on scroll, hero cards). */
.glass {
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
}

/* Restrained brand gradient — used once on the hero, once on accents. */
.gradient-brand {
  background-image: linear-gradient(135deg,
    var(--color-teal-500) 0%,
    var(--color-teal-400) 55%,
    var(--color-teal-300) 100%);
}
.gradient-text {
  background-image: linear-gradient(120deg,
    var(--color-teal-600), var(--color-teal-400));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Hairline ring border — the Linear/Vercel card edge. */
.ring-hairline {
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

/* Scroll-reveal primitive. Elements start slightly down and fade up when a
   tiny observer (in the page) adds .is-visible. Reduced-motion users get the
   final state instantly via the media query above. */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
  will-change: opacity, transform;
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; }
}

/* Interactive card lift — one consistent hover for every clickable card. */
.lift {
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}
.lift:hover {
  transform: translateY(-3px);
}

/* Slow gradient drift for hero background, calm and premium. */
@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.float-slow { animation: float-slow 6s ease-in-out infinite; }

/* Marquee for the logo/stack strip. */
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee-track { animation: marquee 28s linear infinite; }
.marquee-mask {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}`);

mkdirSync(resolve(root, "app"), { recursive: true });
writeFileSync(resolve(root, "app/globals.css"), lines.join("\n") + "\n");
console.log(`app/globals.css written — ${lines.length} lines from design/tokens.json`);
