// Probe for src/shot.mjs: WCAG contrast of every visible text node against the
// nearest opaque background. Prints the failures (worst first).
//   PROBE=src/contrast.mjs LS='{"rm-dark":"1","rm-scheme":"dracula"}' node src/shot.mjs out issues=/issues
export default async (page) => page.evaluate(() => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const parse = (c) => {            // any CSS colour → [r, g, b, a] via canvas
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const lum = (c) => { const l = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none' && /gradient/.test(s.backgroundImage)) {
        const m = s.backgroundImage.match(/(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i); if (m) { stack.push(parse(m[1])); if (stack[stack.length - 1][3] === 1) break; }
      }
      const c = parse(s.backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] === 1) break; }
    }
    let bg = [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    return bg;
  };
  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement; if (!el || el.closest('script,style,noscript,[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
    const bg = bgOf(el); const fg = over(parse(s.color), bg);
    const px = parseFloat(s.fontSize), large = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
    const c = ratio(fg, bg); if (c >= (large ? 3 : 4.5)) continue;
    const key = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const prev = seen.get(key); if (!prev || c < prev.c) seen.set(key, { c: +c.toFixed(2), text: n.nodeValue.trim().slice(0, 24), in: el.parentElement ? el.parentElement.tagName.toLowerCase() + (el.parentElement.id ? '#' + el.parentElement.id : '') : '' });
  }
  return [...seen.entries()].sort((a, b) => a[1].c - b[1].c).slice(0, 14).map(([k, v]) => `${v.c} ${k} <${v.in}> "${v.text}"`);
});
