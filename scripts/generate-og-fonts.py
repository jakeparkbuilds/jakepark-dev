#!/usr/bin/env python3
"""Build the static TTFs that app/opengraph-image.tsx feeds to Satori.

The site ships woff2 (§ 1) and that stays true for anything a browser
downloads. Satori — the renderer behind next/og's ImageResponse — cannot
read woff2 at all (ttf / otf / woff only) and has no variable-font support,
so the OG route needs its own build-time copies. These are read with
fs.readFileSync on the server and are never served to a client.

Two transforms, both of which are load-bearing:

  1. woff2 -> ttf. Straight container change, no outline math.
  2. Bricolage is variable (opsz 12..96, wght 200..800) and its fvar
     DEFAULTS ARE opsz 96 / wght 800. Satori would render the name at 800,
     not the 500 the plate calls for, because it just uses the default
     instance. So the variable font is pinned to a static instance here.

Everything is subset to printable ASCII: the plate's whole string set is
"CS + MATH @ GEORGETOWN" / "Jake" / "Park" / "jakekpark.com", and the OG
route ships inside the serverless bundle.

Run:  python3 scripts/generate-og-fonts.py   (needs fonttools + brotli)
Output: app/fonts/og/*.ttf — committed, like scripts/generate-dc-paths.mjs.
"""

import pathlib

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "app" / "fonts"
OUT = SRC / "og"

# Printable ASCII. Wider than the four strings on the plate on purpose, so
# an edit to the copy cannot silently drop a glyph to .notdef.
UNICODES = list(range(0x20, 0x7F))

# opsz is an optical-size axis, so it is pinned per file to the size the
# plate actually sets that font at: the name is 116px display, the mono
# lines are 20-22px labels (mono has no opsz axis, but the principle is
# why the name gets 96 rather than the axis midpoint).
JOBS = [
    ("bricolage-grotesque-variable.woff2", "bricolage-500.ttf", {"wght": 500, "opsz": 96}),
    ("ibm-plex-mono-400.woff2", "plex-mono-400.ttf", None),
    ("ibm-plex-mono-500.woff2", "plex-mono-500.ttf", None),
]


def build(src_name, out_name, axes):
    font = TTFont(SRC / src_name)
    if axes is not None:
        font = instancer.instantiateVariableFont(font, axes, inplace=True)
    options = subset.Options()
    options.layout_features = ["kern", "liga", "calt"]
    options.notdef_outline = True
    options.recalc_bounds = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    font.flavor = None  # ttf, not woff/woff2 — Satori reads sfnt only
    out = OUT / out_name
    font.save(out)
    print(f"{src_name} -> {out.relative_to(ROOT)}  ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        build(*job)
