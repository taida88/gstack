/**
 * Pure SVG renderer for trading-persona cards.
 *
 * No browser, no canvas, no runtime dependencies — `renderCardSVG` takes a
 * Persona and returns a complete, standalone SVG string. The generator can
 * write that SVG directly, or rasterize it to PNG via Playwright.
 */

import type { Persona } from "./personas.ts";

export interface CardOptions {
  /** Optional owner name stamped on the card ("Issued to ..."). */
  ownerName?: string;
  /** Card width in px (height is derived from the 5:7 ratio). */
  width?: number;
}

const CARD_RATIO = 7 / 5; // classic trading-card aspect

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

export function renderCardSVG(persona: Persona, opts: CardOptions = {}): string {
  const W = opts.width ?? 660;
  const H = Math.round(W * CARD_RATIO);
  const t = persona.theme;
  const pad = Math.round(W * 0.07);
  const gid = `g-${persona.id}`;
  const sigid = `s-${persona.id}`;

  // ---- Trait chips (flow-wrapped) -----------------------------------------
  const chipY = Math.round(H * 0.40);
  const chipH = 34;
  const chipGap = 12;
  let cx = pad;
  let cy = chipY;
  const chipCharW = 8.4;
  const chips = persona.traits
    .map((trait) => {
      const w = Math.round(trait.length * chipCharW + 28);
      if (cx + w > W - pad) {
        cx = pad;
        cy += chipH + chipGap;
      }
      const rect = `
        <g transform="translate(${cx},${cy})">
          <rect width="${w}" height="${chipH}" rx="${chipH / 2}"
                fill="${t.accent}" fill-opacity="0.14"
                stroke="${t.accent}" stroke-opacity="0.55" stroke-width="1.2"/>
          <text x="${w / 2}" y="${chipH / 2 + 5}" text-anchor="middle"
                font-family="'DejaVu Sans','Segoe UI',sans-serif" font-size="15"
                font-weight="600" fill="${t.ink}">${esc(trait)}</text>
        </g>`;
      cx += w + chipGap;
      return rect;
    })
    .join("");
  const chipsBottom = cy + chipH;

  // ---- Stat bars -----------------------------------------------------------
  const statsTop = chipsBottom + 36;
  const barH = 12;
  const rowGap = 40;
  const barX = pad + 168;
  const barW = W - pad - barX;
  const bars = persona.stats
    .map((s, i) => {
      const y = statsTop + i * rowGap;
      const fill = Math.max(0, Math.min(100, s.value));
      const fw = Math.round((barW * fill) / 100);
      return `
        <g transform="translate(0,${y})">
          <text x="${pad}" y="${barH}" font-family="'DejaVu Sans','Segoe UI',sans-serif"
                font-size="15" font-weight="600" fill="${t.muted}">${esc(s.label)}</text>
          <rect x="${barX}" y="0" width="${barW}" height="${barH}" rx="${barH / 2}"
                fill="${t.ink}" fill-opacity="0.12"/>
          <rect x="${barX}" y="0" width="${fw}" height="${barH}" rx="${barH / 2}"
                fill="${t.accent}"/>
          <text x="${W - pad}" y="${barH}" text-anchor="end"
                font-family="'DejaVu Sans',monospace" font-size="13"
                font-weight="700" fill="${t.ink}">${fill}</text>
        </g>`;
    })
    .join("");

  // ---- Flavor quote --------------------------------------------------------
  const quoteLines = wrap(persona.quote, 42);
  const quoteTop = statsTop + persona.stats.length * rowGap + 28;
  const quote = quoteLines
    .map(
      (ln, i) =>
        `<text x="${W / 2}" y="${quoteTop + i * 24}" text-anchor="middle"
           font-family="'DejaVu Serif','Georgia',serif" font-style="italic"
           font-size="17" fill="${t.muted}">${esc((i === 0 ? "“" : "") + ln + (i === quoteLines.length - 1 ? "”" : ""))}</text>`,
    )
    .join("");

  // ---- Owner stamp ---------------------------------------------------------
  const owner = opts.ownerName
    ? `<text x="${W / 2}" y="${H - pad - 28}" text-anchor="middle"
         font-family="'DejaVu Sans','Segoe UI',sans-serif" font-size="13"
         letter-spacing="2" fill="${t.muted}">ISSUED TO · ${esc(opts.ownerName.toUpperCase())}</text>`
    : "";

  // ---- Rarity ribbon -------------------------------------------------------
  const rarity = `
    <g transform="translate(${W - pad - 132},${pad - 6})">
      <rect width="132" height="30" rx="15" fill="${t.accent}" fill-opacity="0.18"
            stroke="${t.accent}" stroke-width="1.4"/>
      <text x="66" y="20" text-anchor="middle"
            font-family="'DejaVu Sans','Segoe UI',sans-serif" font-size="13"
            font-weight="800" letter-spacing="2" fill="${t.ink}">${esc(persona.rarity.toUpperCase())}</text>
    </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${t.from}"/>
      <stop offset="1" stop-color="${t.to}"/>
    </linearGradient>
    <radialGradient id="${sigid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- card body -->
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="34" fill="url(#${gid})"/>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="34"
        fill="none" stroke="${t.accent}" stroke-opacity="0.6" stroke-width="2.5"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="26"
        fill="none" stroke="${t.ink}" stroke-opacity="0.10" stroke-width="1"/>

  <!-- sigil glow + glyph -->
  <circle cx="${pad + 46}" cy="${pad + 52}" r="70" fill="url(#${sigid})"/>
  <text x="${pad + 2}" y="${pad + 78}" font-size="74">${esc(persona.glyph)}</text>

  ${rarity}

  <!-- name + tagline -->
  <text x="${pad}" y="${pad + 150}" font-family="'DejaVu Sans','Segoe UI',sans-serif"
        font-size="38" font-weight="800" fill="${t.ink}">${esc(persona.name)}</text>
  <text x="${pad}" y="${pad + 182}" font-family="'DejaVu Sans','Segoe UI',sans-serif"
        font-size="18" font-weight="500" fill="${t.muted}">${esc(persona.tagline)}</text>
  <line x1="${pad}" y1="${pad + 202}" x2="${W - pad}" y2="${pad + 202}"
        stroke="${t.accent}" stroke-opacity="0.4" stroke-width="1.5"/>

  ${chips}
  ${bars}
  ${quote}
  ${owner}

  <!-- footer -->
  <text x="${W / 2}" y="${H - pad + 4}" text-anchor="middle"
        font-family="'DejaVu Sans',monospace" font-size="12" letter-spacing="3"
        fill="${t.muted}" opacity="0.8">gstack · TRADING PERSONA</text>
</svg>`;
}
