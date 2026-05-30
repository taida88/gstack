#!/usr/bin/env bun
/**
 * Trading-persona card generator.
 *
 * Renders a collectible-style card for each predefined trader archetype.
 * Always writes an SVG (no browser needed). If `--png` is requested and a
 * Playwright Chromium is available, it also rasterizes each card to PNG.
 *
 * Usage:
 *   bun run trading-cards/generate.ts                 # all personas → SVG
 *   bun run trading-cards/generate.ts --png           # also write PNGs
 *   bun run trading-cards/generate.ts --only hodler   # one persona
 *   bun run trading-cards/generate.ts --name "Alice"  # stamp an owner
 *   bun run trading-cards/generate.ts --list          # list archetype ids
 *   bun run trading-cards/generate.ts --out ./cards   # custom output dir
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PERSONAS, findPersona, type Persona } from "./personas.ts";
import { renderCardSVG } from "./card.ts";

interface Args {
  out: string;
  png: boolean;
  only?: string;
  name?: string;
  list: boolean;
  width: number;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const here = dirname(fileURLToPath(import.meta.url));
  const a: Args = {
    out: join(here, "out"),
    png: false,
    list: false,
    width: 660,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--png":
        a.png = true;
        break;
      case "--no-png":
        a.png = false;
        break;
      case "--list":
        a.list = true;
        break;
      case "-h":
      case "--help":
        a.help = true;
        break;
      case "--out":
        a.out = resolve(argv[++i] ?? a.out);
        break;
      case "--only":
        a.only = argv[++i];
        break;
      case "--name":
        a.name = argv[++i];
        break;
      case "--width":
        a.width = Number(argv[++i]) || a.width;
        break;
      default:
        // bare token → treat as --only shortcut
        if (!arg.startsWith("-") && !a.only) a.only = arg;
    }
  }
  return a;
}

function printHelp(): void {
  console.log(`Trading-persona card generator

  bun run trading-cards/generate.ts [options]

Options:
  --png            also rasterize each card to PNG (needs Playwright Chromium)
  --only <id>      generate a single archetype (see --list)
  --name <name>    stamp an owner name on the card ("ISSUED TO ...")
  --out <dir>      output directory (default: trading-cards/out)
  --width <px>     card width in px (default: 660)
  --list           list available archetype ids
  -h, --help       show this help

Archetypes:
${PERSONAS.map((p) => `  ${p.id.padEnd(20)} ${p.glyph}  ${p.name}`).join("\n")}`);
}

/** Rasterize SVG strings to PNG via Playwright, if a browser is available. */
async function rasterize(
  cards: { id: string; svg: string; width: number; height: number }[],
  outDir: string,
): Promise<boolean> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.warn("⚠  Playwright not installed — skipping PNG. (SVGs were written.)");
    return false;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.warn(
      `⚠  Could not launch Chromium — skipping PNG. (SVGs were written.)\n   ${(err as Error).message.split("\n")[0]}\n   Try: bunx playwright install chromium`,
    );
    return false;
  }

  try {
    const scale = 2; // crisp on retina / large displays
    for (const c of cards) {
      const page = await browser.newPage({
        viewport: { width: c.width, height: c.height },
        deviceScaleFactor: scale,
      });
      const html = `<!doctype html><html><head><meta charset="utf-8">
        <style>html,body{margin:0;padding:0;background:transparent}
        svg{display:block}</style></head><body>${c.svg}</body></html>`;
      await page.setContent(html, { waitUntil: "networkidle" });
      const pngPath = join(outDir, `${c.id}.png`);
      await page.screenshot({ path: pngPath, omitBackground: true });
      await page.close();
      console.log(`  ✓ ${c.id}.png`);
    }
    return true;
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  if (args.list) {
    for (const p of PERSONAS) console.log(`${p.id.padEnd(20)} ${p.glyph}  ${p.name}`);
    return;
  }

  let selected: Persona[];
  if (args.only) {
    const p = findPersona(args.only);
    if (!p) {
      console.error(`✗ Unknown archetype "${args.only}". Run with --list to see ids.`);
      process.exitCode = 1;
      return;
    }
    selected = [p];
  } else {
    selected = PERSONAS;
  }

  await mkdir(args.out, { recursive: true });

  const height = Math.round(args.width * (7 / 5));
  const cards: { id: string; svg: string; width: number; height: number }[] = [];

  console.log(`Generating ${selected.length} card(s) → ${args.out}`);
  for (const p of selected) {
    const svg = renderCardSVG(p, { ownerName: args.name, width: args.width });
    const svgPath = join(args.out, `${p.id}.svg`);
    await writeFile(svgPath, svg, "utf8");
    console.log(`  ✓ ${p.id}.svg`);
    cards.push({ id: p.id, svg, width: args.width, height });
  }

  if (args.png) {
    console.log("Rasterizing to PNG…");
    await rasterize(cards, args.out);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
