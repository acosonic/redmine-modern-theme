#!/usr/bin/env python3
"""Generate the colour-scheme blocks in application.css and theme.js from Gogh.

Usage:
    python3 tools/gen-schemes.py path/to/gogh/data/themes.json [--check]

Gogh (https://github.com/Gogh-Co/Gogh, MIT/Apache-2.0) publishes every terminal
palette in data/themes.json. For each scheme listed in SCHEMES below this script
picks the raw --s-* inputs that section 2b of application.css derives all tokens
from, checks contrast the way the CSS will render it, nudges colours that fail,
and rewrites the text between the @schemes markers in both files. --check only
prints the report.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'stylesheets' / 'application.css'
JS = ROOT / 'javascripts' / 'theme.js'

# Gogh name → accent slot. ("One Dark" in Gogh has the comment grey #5C6370 as its
# foreground, so the canonical palette comes from "One Dark Pro".)
# Default accent is color_05 ("blue"); a few schemes are known by
# another hue (Nord's frost cyan, Rosé Pine's iris, Gruvbox's yellow).
SCHEMES = {
    # dark
    'Dracula': None, 'Nord': 'color_07', 'Gruvbox Dark': 'color_04', 'One Dark Pro': None,
    'Catppuccin Mocha': None, 'Catppuccin Macchiato': None, 'Rose Pine': 'color_06',
    'Rose Pine Moon': 'color_06', 'GitHub Dark': None, 'GitHub Dark Dimmed': None,
    'Everforest Dark': None, 'Kanagawa Wave': None, 'Monokai Pro': None, 'Ayu Dark': None,
    'Ayu Mirage': None, 'Material Ocean': None, 'Material Palenight': None,
    'Solarized Dark': None, 'TokyoNight': None,
    # light
    'Solarized Light': None, 'Gruvbox Light': None, 'Catppuccin Latte': None,
    'GitHub Light Default': None, 'One Light': None, 'Rose Pine Dawn': 'color_06',
    'Everforest Light': None, 'Kanagawa Lotus': None, 'Ayu Light': None, 'TokyoNight Day': None,
}
DISPLAY = {'One Dark Pro': 'One Dark', 'GitHub Light Default': 'GitHub Light', 'TokyoNight': 'Tokyo Night',
           'TokyoNight Day': 'Tokyo Night Day', 'Rose Pine': 'Rosé Pine',
           'Rose Pine Moon': 'Rosé Pine Moon', 'Rose Pine Dawn': 'Rosé Pine Dawn'}

TEXT_MIN = 4.5   # WCAG AA body text: links (accent), muted text, danger text
FG_MIN = 7.0     # main text should be comfortably above AA
FG_MAX_NUDGE = 40  # % a scheme's foreground may be pulled before it stops being that scheme


# ── colour maths (sRGB, same as CSS color-mix(in srgb, …)) ──────────────────
def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def hexs(c):
    return '#' + ''.join(f'{round(max(0, min(1, v)) * 255):02X}' for v in c)


def mix(a, b, pa):
    """color-mix(in srgb, a pa, b) with pa in 0..1"""
    return tuple(x * pa + y * (1 - pa) for x, y in zip(a, b))


def lum(c):
    lin = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


WHITE, BLACK = (1, 1, 1), (0, 0, 0)


def worst_contrast(c, backgrounds):
    return min(contrast(c, b) for b in backgrounds)


def nudge(c, backgrounds, towards, target=TEXT_MIN):
    """Mix c towards `towards` in 5% steps until it passes on every background."""
    for step in range(0, 101, 5):
        out = mix(towards, c, step / 100)
        if worst_contrast(out, backgrounds) >= target:
            return out, step
    return out, 100


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


# ── per-scheme derivation, mirrors section 2b of application.css ────────────
def build(t, accent_slot):
    dark = t['variant'] == 'dark'
    bg, fg0 = rgb(t['background']), rgb(t['foreground'])
    toward, toward_name = (WHITE, 'white') if dark else (BLACK, 'black')
    notes = []

    def backgrounds(fg):
        # --c-bg, --c-surface, --c-surface-2: cards lift towards fg (dark) or white (light)
        return [bg, mix(fg, bg, .06), mix(fg, bg, .10)] if dark else \
               [bg, mix(WHITE, bg, .65), mix(WHITE, bg, .35)]

    # Main text: pull towards white/black until it clears FG_MIN on every surface
    for fg_step in range(0, FG_MAX_NUDGE + 1, 5):
        fg = mix(toward, fg0, fg_step / 100)
        worst = backgrounds(fg)
        if worst_contrast(fg, worst) >= FG_MIN:
            break
    fg_c = worst_contrast(fg, worst)
    if fg_step:
        notes.append(f'fg {worst_contrast(fg0, backgrounds(fg0)):.2f}→{fg_c:.2f} (+{fg_step}% {toward_name})')

    # --s-muted: the least fg (from the CSS default of 72%) that still reads as body text
    for pct in range(72, 101, 2):
        muted = mix(fg, bg, pct / 100)
        if worst_contrast(muted, worst) >= TEXT_MIN:
            break
    muted_c = worst_contrast(muted, worst)

    # Accent is link text and red is error text: both must pass as body text.
    # A failing colour is pulled towards white (dark) / black (light) until it does.
    fixed = {}
    for key, slot in (('accent', accent_slot or 'color_05'), ('red', 'color_02')):
        c0 = rgb(t[slot])
        c, step = nudge(c0, worst, toward)
        if step:
            notes.append(f'{key} {worst_contrast(c0, worst):.2f}→{worst_contrast(c, worst):.2f} (+{step}% {toward_name})')
        fixed[key] = c
    accent, red = fixed['accent'], fixed['red']

    # Text on the accent (buttons, current page): bg colour reads best when it passes
    cands = [bg, WHITE, BLACK] if dark else [WHITE, bg, BLACK]
    on = next((c for c in cands if contrast(c, accent) >= TEXT_MIN), max(cands, key=lambda c: contrast(c, accent)))
    on_c = contrast(on, accent)

    ok = fg_c >= FG_MIN and muted_c >= TEXT_MIN and on_c >= TEXT_MIN
    return {
        'id': slug(DISPLAY.get(t['name'], t['name'])),
        'name': DISPLAY.get(t['name'], t['name']),
        'gogh': t['name'], 'dark': dark,
        'bg': hexs(bg), 'fg': hexs(fg), 'muted': hexs(muted), 'accent': hexs(accent), 'on': hexs(on),
        'red': hexs(red), 'green': t['color_03'].upper(), 'yellow': t['color_04'].upper(),
        'blue': t['color_05'].upper(),
        'report': f'fg {fg_c:5.2f}  muted {muted_c:5.2f}  accent {worst_contrast(accent, worst):5.2f}  on-accent {on_c:5.2f}',
        'notes': notes, 'ok': ok,
    }


def css_block(s):
    return (f'  /* Gogh: {s["gogh"]} */\n'
            f'  html[data-scheme="{s["id"]}"] {{\n'
            f'    --s-bg: {s["bg"]};  --s-fg: {s["fg"]};  --s-muted: {s["muted"]};\n'
            f'    --s-accent: {s["accent"]};  --s-on-accent: {s["on"]};\n'
            f'    --s-red: {s["red"]};  --s-green: {s["green"]};  --s-yellow: {s["yellow"]};  --s-blue: {s["blue"]};\n'
            f'  }}\n')


def js_line(s):
    return (f"    {{ id: '{s['id']}', name: '{s['name']}', dark: {'true' if s['dark'] else 'false'}, "
            f"swatch: ['{s['bg']}', '{s['fg']}', '{s['accent']}'] }},")


def replace_between(path, begin, end, body):
    text = path.read_text()
    pat = re.compile(rf'({re.escape(begin)}\n).*?([ \t]*{re.escape(end)})', re.S)
    if not pat.search(text):
        sys.exit(f'markers {begin!r} / {end!r} not found in {path}')
    path.write_text(pat.sub(lambda m: m.group(1) + body.rstrip('\n') + '\n' + m.group(2), text, count=1))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    themes = {t['name']: t for t in json.loads(Path(sys.argv[1]).read_text())}
    missing = [n for n in SCHEMES if n not in themes]
    if missing:
        sys.exit(f'not in Gogh data: {missing}')
    built = [build(themes[n], slot) for n, slot in SCHEMES.items()]
    for s in built:
        flag = 'ok  ' if s['ok'] else 'DROP'
        print(f'{flag} {s["name"]:22} {"dark " if s["dark"] else "light"}  {s["report"]}  {"; ".join(s["notes"])}')
    keep = [s for s in built if s['ok']]
    keep.sort(key=lambda s: (not s['dark'], s['name'].lower()))
    print(f'\n{len(keep)} of {len(built)} schemes pass')
    if '--check' in sys.argv:
        return
    replace_between(CSS, '/* @schemes:begin — generated by tools/gen-schemes.py, do not edit */',
                    '/* @schemes:end */', ''.join(css_block(s) for s in keep))
    replace_between(JS, '// @schemes:begin — generated by tools/gen-schemes.py, do not edit',
                    '// @schemes:end', '\n'.join(js_line(s) for s in keep))
    print(f'wrote {CSS.relative_to(ROOT)} and {JS.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
