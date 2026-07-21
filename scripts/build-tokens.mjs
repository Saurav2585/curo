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
}`);

mkdirSync(resolve(root, "app"), { recursive: true });
writeFileSync(resolve(root, "app/globals.css"), lines.join("\n") + "\n");
console.log(`app/globals.css written — ${lines.length} lines from design/tokens.json`);
