/**
 * Pure SVG renderer for trading-persona cards — Binance app design style.
 *
 * No browser, no canvas, no runtime dependencies — `renderCardSVG` takes a
 * Persona and returns a complete, standalone SVG string. The generator can
 * write that SVG directly, or rasterize it to PNG via Playwright.
 *
 * Design language mirrors the Binance mobile app:
 *   - near-black surfaces (#181A20 page, #1E2026 card, #2B3139 chips)
 *   - Binance yellow brand (#FCD535 / #F0B90B) for the logo + accents
 *   - market semantics: up = green #0ECB81, down = red #F6465D
 *   - a trading-pair header, a 24h change badge, and a candlestick spark
 */

import type { Persona, Sentiment } from "./personas.ts";

export interface CardOptions {
  /** Optional owner name stamped on the card ("Issued to ..."). */
  ownerName?: string;
  /** Card width in px (height is derived from the 5:7 ratio). */
  width?: number;
}

const CARD_RATIO = 7 / 5; // classic trading-card aspect

// ─── Binance palette ────────────────────────────────────────────
const BG = "#181A20"; // app background
const SURFACE = "#1E2026"; // card surface
const CHIP = "#2B3139"; // chips / secondary surface
const HAIRLINE = "#2B3139"; // dividers
const YELLOW = "#FCD535"; // Binance primary
const YELLOW_DEEP = "#F0B90B"; // Binance logo deep
const GREEN = "#0ECB81"; // up
const RED = "#F6465D"; // down
const TEXT = "#EAECEF"; // primary text
const MUTED = "#848E9C"; // secondary text
const FONT = "'DejaVu Sans','Segoe UI',Arial,sans-serif";
const MONO = "'DejaVu Sans Mono',monospace";

/** Escape text for safe inclusion in SVG/XML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Greedy word-wrap by character budget, for the flavor quote. */
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function changeColor(change: number): string {
  if (change > 0) return GREEN;
  if (change < 0) return RED;
  return MUTED;
}

function formatChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * The Binance logo mark — four rotated squares around a center diamond.
 * Drawn at (cx, cy) sized by `u` (unit square edge). Pure vector, brand-accurate.
 */
function binanceMark(cx: number, cy: number, u: number, color: string): string {
  const g = u * 1.55; // gap from center to outer diamonds
  const sq = (dx: number, dy: number) =>
    `<rect x="${(-u / 2).toFixed(2)}" y="${(-u / 2).toFixed(2)}" width="${u}" height="${u}" rx="${(u * 0.18).toFixed(2)}" transform="translate(${(cx + dx).toFixed(2)},${(cy + dy).toFixed(2)}) rotate(45)" fill="${color}"/>`;
  return `
    <g>
      ${sq(0, -g)}
      ${sq(0, g)}
      ${sq(-g, 0)}
      ${sq(g, 0)}
      ${sq(0, 0)}
    </g>`;
}

/**
 * Deterministic candlestick spark for a persona. Seeded by ticker so each card
 * is stable across runs. `bias` nudges the drift up/down per sentiment.
 */
function candles(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  sentiment: Sentiment,
): string {
  // tiny seeded PRNG (mulberry32)
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const n = 14;
  const drift = sentiment === "bull" ? 0.9 : sentiment === "bear" ? -0.9 : 0;
  const slot = w / n;
  const bodyW = slot * 0.56;
  let price = 50;
  const lo = 8;
  const hi = 92;
  let out = "";
  for (let i = 0; i < n; i++) {
    const open = price;
    const move = (rnd() - 0.5) * 22 + drift * 2.2;
    let close = Math.max(lo, Math.min(hi, open + move));
    const wickUp = rnd() * 7;
    const wickDn = rnd() * 7;
    const top = Math.min(open, close) - wickDn;
    const bot = Math.max(open, close) + wickUp;
    price = close;

    const up = close >= open;
    const col = up ? GREEN : RED;
    const cxp = x + i * slot + slot / 2;
    const toY = (v: number) => y + h - ((v - 0) / 100) * h;
    const bodyTop = toY(Math.max(open, close));
    const bodyBot = toY(Math.min(open, close));
    const bodyH = Math.max(2, bodyBot - bodyTop);
    out += `
      <line x1="${cxp.toFixed(1)}" y1="${toY(bot).toFixed(1)}" x2="${cxp.toFixed(1)}" y2="${toY(top).toFixed(1)}" stroke="${col}" stroke-width="1.3"/>
      <rect x="${(cxp - bodyW / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${bodyW.toFixed(1)}" height="${bodyH.toFixed(1)}" rx="1" fill="${col}"/>`;
  }
  return out;
}

export function renderCardSVG(persona: Persona, opts: CardOptions = {}): string {
  const W = opts.width ?? 660;
  const H = Math.round(W * CARD_RATIO);
  const pad = Math.round(W * 0.06);
  const inner = W - pad * 2;
  const cCol = changeColor(persona.change);

  // ── Header: asset glyph token + pair + 24h change ───────────────
  const headY = pad + 14;
  const tokenR = 30;
  const tokenCx = pad + tokenR;
  const tokenCy = headY + tokenR;
  const header = `
    <circle cx="${tokenCx}" cy="${tokenCy}" r="${tokenR}" fill="${CHIP}"/>
    <circle cx="${tokenCx}" cy="${tokenCy}" r="${tokenR}" fill="none" stroke="${YELLOW}" stroke-opacity="0.5" stroke-width="1.5"/>
    <text x="${tokenCx}" y="${tokenCy + 14}" text-anchor="middle" font-size="34">${esc(persona.glyph)}</text>

    <text x="${tokenCx + tokenR + 16}" y="${tokenCy - 6}" font-family="${FONT}" font-size="26" font-weight="700" fill="${TEXT}">${esc(persona.ticker)}<tspan fill="${MUTED}" font-weight="500">/USDT</tspan></text>
    <text x="${tokenCx + tokenR + 16}" y="${tokenCy + 18}" font-family="${FONT}" font-size="14" font-weight="500" fill="${MUTED}">${esc(persona.rarity)} · Persona</text>

    <g transform="translate(${W - pad - 104},${headY + 6})">
      <rect width="104" height="34" rx="6" fill="${cCol}" fill-opacity="0.16"/>
      <text x="52" y="23" text-anchor="middle" font-family="${MONO}" font-size="16" font-weight="700" fill="${cCol}">${esc(formatChange(persona.change))}</text>
    </g>
    <text x="${W - pad}" y="${headY + 58}" text-anchor="end" font-family="${FONT}" font-size="12" fill="${MUTED}">24h Change</text>`;

  // ── Name + tagline ──────────────────────────────────────────────
  const nameY = tokenCy + tokenR + 50;
  const name = `
    <text x="${pad}" y="${nameY}" font-family="${FONT}" font-size="34" font-weight="800" fill="${TEXT}">${esc(persona.name)}</text>
    <text x="${pad}" y="${nameY + 28}" font-family="${FONT}" font-size="16" font-weight="500" fill="${MUTED}">${esc(persona.tagline)}</text>`;

  // ── Candlestick panel ───────────────────────────────────────────
  const chartY = nameY + 48;
  const chartH = Math.round(H * 0.16);
  const chart = `
    <rect x="${pad}" y="${chartY}" width="${inner}" height="${chartH}" rx="10" fill="${BG}"/>
    <rect x="${pad}" y="${chartY}" width="${inner}" height="${chartH}" rx="10" fill="none" stroke="${HAIRLINE}" stroke-width="1"/>
    ${candles(pad + 14, chartY + 14, inner - 28, chartH - 28, persona.ticker, persona.sentiment)}`;

  // ── Trait chips (flow-wrapped) ──────────────────────────────────
  const chipY0 = chartY + chartH + 26;
  const chipH = 32;
  const chipGap = 10;
  let cx = pad;
  let cy = chipY0;
  const chipCharW = 8.2;
  const chips = persona.traits
    .map((trait) => {
      const w = Math.round(trait.length * chipCharW + 26);
      if (cx + w > W - pad) {
        cx = pad;
        cy += chipH + chipGap;
      }
      const rect = `
        <g transform="translate(${cx},${cy})">
          <rect width="${w}" height="${chipH}" rx="6" fill="${CHIP}"/>
          <text x="${w / 2}" y="${chipH / 2 + 5}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="${TEXT}">${esc(trait)}</text>
        </g>`;
      cx += w + chipGap;
      return rect;
    })
    .join("");
  const chipsBottom = cy + chipH;

  // ── Stat bars (Binance yellow fill) ─────────────────────────────
  const statsTop = chipsBottom + 30;
  const barH = 10;
  const rowGap = 38;
  const barX = pad + 150;
  const valueColW = 42; // reserved gutter so the value never sits on the fill
  const barW = W - pad - barX - valueColW;
  const bars = persona.stats
    .map((stat, i) => {
      const y = statsTop + i * rowGap;
      const fill = Math.max(0, Math.min(100, stat.value));
      const fw = Math.round((barW * fill) / 100);
      return `
        <g transform="translate(0,${y})">
          <text x="${pad}" y="${barH}" font-family="${FONT}" font-size="14" font-weight="500" fill="${MUTED}">${esc(stat.label)}</text>
          <rect x="${barX}" y="0" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${CHIP}"/>
          <rect x="${barX}" y="0" width="${fw}" height="${barH}" rx="${barH / 2}" fill="${YELLOW}"/>
          <text x="${W - pad}" y="${barH}" text-anchor="end" font-family="${MONO}" font-size="13" font-weight="700" fill="${TEXT}">${fill}</text>
        </g>`;
    })
    .join("");

  // ── Flavor quote ────────────────────────────────────────────────
  const quoteLines = wrap(persona.quote, 46);
  const quoteTop = statsTop + persona.stats.length * rowGap + 18;
  const quote = quoteLines
    .map(
      (ln, i) =>
        `<text x="${W / 2}" y="${quoteTop + i * 22}" text-anchor="middle" font-family="${FONT}" font-style="italic" font-size="15" fill="${MUTED}">${esc((i === 0 ? "“" : "") + ln + (i === quoteLines.length - 1 ? "”" : ""))}</text>`,
    )
    .join("");
  const quoteBottom = quoteTop + quoteLines.length * 22;

  // ── Owner stamp ─────────────────────────────────────────────────
  const owner = opts.ownerName
    ? `<text x="${W / 2}" y="${quoteBottom + 18}" text-anchor="middle" font-family="${FONT}" font-size="12" letter-spacing="1.5" fill="${MUTED}">ISSUED TO · ${esc(opts.ownerName.toUpperCase())}</text>`
    : "";

  // ── Footer: Binance brand lockup ────────────────────────────────
  const footY = H - pad - 6;
  const footer = `
    <line x1="${pad}" y1="${footY - 26}" x2="${W - pad}" y2="${footY - 26}" stroke="${HAIRLINE}" stroke-width="1"/>
    ${binanceMark(pad + 9, footY - 4, 7, YELLOW)}
    <text x="${pad + 26}" y="${footY + 1}" font-family="${FONT}" font-size="15" font-weight="700" fill="${TEXT}">BINANCE</text>
    <text x="${W - pad}" y="${footY + 1}" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${MUTED}">TRADING PERSONA</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- page -->
  <rect width="${W}" height="${H}" rx="28" fill="${BG}"/>
  <!-- card surface -->
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="22" fill="${SURFACE}"/>
  <!-- top brand accent -->
  <rect x="8" y="8" width="${W - 16}" height="5" rx="2.5" fill="${YELLOW}"/>

  ${header}
  ${name}
  ${chart}
  ${chips}
  ${bars}
  ${quote}
  ${owner}
  ${footer}
</svg>`;
}
