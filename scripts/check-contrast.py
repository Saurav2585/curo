#!/usr/bin/env python3
"""Assert every meaningful token pair in Curo meets WCAG 2.2 AA.

Run:  python3 scripts/check-contrast.py
Exits non-zero on any failure, so it can gate CI.
"""
import json
import sys
from pathlib import Path

TOKENS = json.loads((Path(__file__).parent.parent / "design" / "tokens.json").read_text())
PRIM = TOKENS["primitives"]["color"]
SEM = TOKENS["semantic"]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rel_luminance(h):
    def chan(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(fg, bg):
    l1, l2 = rel_luminance(fg), rel_luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def resolve(mode, group, key):
    """Semantic token -> literal hex, following the {color.family.step} reference."""
    ref = SEM[mode][group][key]
    if ref.startswith("{"):
        _, family, step = ref.strip("{}").split(".")
        return PRIM[family][step]
    return ref


# (label, fg group/key, bg group/key, required ratio)
# 4.5 = body text · 3.0 = large text (>=18.66px bold / 24px) and non-text UI boundaries
CHECKS = [
    ("body on surface",          ("text", "primary"),   ("bg", "surface"),      4.5),
    ("body on canvas",           ("text", "primary"),   ("bg", "canvas"),       4.5),
    ("secondary on surface",     ("text", "secondary"), ("bg", "surface"),      4.5),
    ("muted on surface",         ("text", "muted"),     ("bg", "surface"),      4.5),
    ("muted on canvas",          ("text", "muted"),     ("bg", "canvas"),       4.5),
    ("muted on sunken",          ("text", "muted"),     ("bg", "sunken"),       4.5),
    ("on-brand on brand",        ("text", "onBrand"),   ("bg", "brand"),        4.5),
    ("on-brand on brand hover",  ("text", "onBrand"),   ("bg", "brandHover"),   4.5),
    ("brand text on surface",    ("text", "brand"),     ("bg", "surface"),      4.5),
    ("brand text on subtle",     ("text", "brand"),     ("bg", "brandSubtle"),  4.5),
    ("success on subtle",        ("text", "success"),   ("bg", "successSubtle"), 4.5),
    ("warn on subtle",           ("text", "warn"),      ("bg", "warnSubtle"),   4.5),
    ("danger on subtle",         ("text", "danger"),    ("bg", "dangerSubtle"), 4.5),
    ("on-inverse on inverse",    ("text", "onInverse"), ("bg", "inverse"),      4.5),
    # Non-text UI boundaries — 1.4.11. Only tokens that BOUND AN INTERACTIVE ELEMENT
    # are in scope; border.subtle and border.default are decorative (dividers, card
    # edges) and are deliberately exempt.
    ("control border on surface", ("border", "control"), ("bg", "surface"),     3.0),
    ("control border on canvas",  ("border", "control"), ("bg", "canvas"),      3.0),
    ("hover border on surface",   ("border", "strong"),  ("bg", "surface"),     3.0),
    ("focus ring on surface",     ("border", "focus"),   ("bg", "surface"),     3.0),
    ("brand border on surface",   ("border", "brand"),   ("bg", "surface"),     3.0),
    ("danger border on surface",  ("border", "danger"),  ("bg", "surface"),     3.0),
]

# The slot grid resolved to literals — the component the whole product hangs on.
SLOT_CHECKS = {
    "light": [
        ("slot available text",   PRIM["teal"]["600"],    PRIM["neutral"]["0"],   4.5),
        ("slot available border", PRIM["teal"]["500"],    PRIM["neutral"]["0"],   3.0),
        ("slot filling text",     PRIM["amber"]["700"],   PRIM["amber"]["50"],    4.5),
        ("slot filling border",   PRIM["amber"]["500"],   PRIM["neutral"]["0"],   3.0),
        ("slot booked text",      PRIM["neutral"]["600"], PRIM["neutral"]["100"], 4.5),
        ("slot selected text",    PRIM["neutral"]["0"],   PRIM["teal"]["500"],    4.5),
    ],
    "dark": [
        ("slot available text",   PRIM["teal"]["300"],    PRIM["neutral"]["900"], 4.5),
        ("slot selected text",    PRIM["neutral"]["950"], PRIM["teal"]["400"],    4.5),
        ("slot booked text",      PRIM["neutral"]["400"], PRIM["neutral"]["950"], 4.5),
    ],
}

failures = []
print(f"{'':4}{'pair':28}{'mode':7}{'fg':9}{'bg':9}{'ratio':>7}  need")
print("-" * 74)

for mode in ("light", "dark"):
    for label, (fg_g, fg_k), (bg_g, bg_k), need in CHECKS:
        fg, bg = resolve(mode, fg_g, fg_k), resolve(mode, bg_g, bg_k)
        r = ratio(fg, bg)
        ok = r >= need
        if not ok:
            failures.append((label, mode, fg, bg, r, need))
        print(f"{'ok  ' if ok else 'FAIL'}{label:28}{mode:7}{fg:9}{bg:9}{r:7.2f}  {need}")

for mode, checks in SLOT_CHECKS.items():
    for label, fg, bg, need in checks:
        r = ratio(fg, bg)
        ok = r >= need
        if not ok:
            failures.append((label, mode, fg, bg, r, need))
        print(f"{'ok  ' if ok else 'FAIL'}{label:28}{mode:7}{fg:9}{bg:9}{r:7.2f}  {need}")

print("-" * 74)
if failures:
    print(f"\n{len(failures)} FAILING PAIR(S):")
    for label, mode, fg, bg, r, need in failures:
        print(f"  {label} ({mode}): {fg} on {bg} = {r:.2f}, needs {need}")
    sys.exit(1)

print("\nAll pairs pass WCAG 2.2 AA.")
