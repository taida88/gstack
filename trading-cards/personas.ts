/**
 * Predefined trading-persona archetypes.
 *
 * Each archetype is a self-contained description of a recognizable trader
 * "type" — its temperament, its edge, and a set of normalized stats (0–100)
 * that drive the visual stat-bars on the generated card.
 *
 * This data is the single source of truth for the card generator. Add a new
 * archetype here and it automatically gets a card.
 */

export interface PersonaStat {
  /** Short label shown next to the bar, e.g. "Risk Appetite". */
  label: string;
  /** Normalized 0–100 value driving the bar fill. */
  value: number;
}

export interface PersonaTheme {
  /** Top gradient stop (hex). */
  from: string;
  /** Bottom gradient stop (hex). */
  to: string;
  /** Accent used for bars, chips, and rules (hex). */
  accent: string;
  /** Primary text color (hex). */
  ink: string;
  /** Muted/secondary text color (hex). */
  muted: string;
}

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface Persona {
  /** Stable kebab-case id; also the output filename. */
  id: string;
  /** Display name of the archetype. */
  name: string;
  /** One-line subtitle under the name. */
  tagline: string;
  /** Single emoji used as the card's sigil. */
  glyph: string;
  /** Collectible-style rarity ribbon. */
  rarity: Rarity;
  /** Color theme for the card. */
  theme: PersonaTheme;
  /** Short trait chips (3–4 work best). */
  traits: string[];
  /** Five normalized stats rendered as bars. */
  stats: PersonaStat[];
  /** Flavor quote printed near the bottom. */
  quote: string;
}

/** The canonical stat axes every persona is scored on, in display order. */
export const STAT_AXES = [
  "Risk Appetite",
  "Patience",
  "Time Horizon",
  "Activity",
  "Conviction",
] as const;

function stats(values: Record<(typeof STAT_AXES)[number], number>): PersonaStat[] {
  return STAT_AXES.map((label) => ({ label, value: values[label] }));
}

export const PERSONAS: Persona[] = [
  {
    id: "day-trader",
    name: "The Day Trader",
    tagline: "Flat by the closing bell",
    glyph: "📈",
    rarity: "Uncommon",
    theme: { from: "#2a0a0a", to: "#7a1f12", accent: "#ff5a3c", ink: "#fff4f0", muted: "#f0b3a4" },
    traits: ["Intraday", "High Tempo", "Charts > Sleep", "Tight Stops"],
    stats: stats({
      "Risk Appetite": 82,
      Patience: 24,
      "Time Horizon": 12,
      Activity: 95,
      Conviction: 55,
    }),
    quote: "I don't hold overnight — surprises happen while you sleep.",
  },
  {
    id: "scalper",
    name: "The Scalper",
    tagline: "A hundred small wins a day",
    glyph: "⚡",
    rarity: "Rare",
    theme: { from: "#05210f", to: "#0f7a3a", accent: "#39ff88", ink: "#effff5", muted: "#9be8bd" },
    traits: ["Sub-Minute", "Order Flow", "Max Frequency", "Tiny Edge"],
    stats: stats({
      "Risk Appetite": 70,
      Patience: 8,
      "Time Horizon": 4,
      Activity: 100,
      Conviction: 38,
    }),
    quote: "Take the ticks. Ten cents, a thousand times, beats hope.",
  },
  {
    id: "swing-trader",
    name: "The Swing Trader",
    tagline: "Riding the multi-day wave",
    glyph: "🌊",
    rarity: "Common",
    theme: { from: "#04212b", to: "#0e6b86", accent: "#34d3ff", ink: "#eefcff", muted: "#9bdcef" },
    traits: ["Multi-Day", "Trend + Pullback", "Balanced", "Setup-Driven"],
    stats: stats({
      "Risk Appetite": 58,
      Patience: 60,
      "Time Horizon": 45,
      Activity: 55,
      Conviction: 62,
    }),
    quote: "The trend is my friend — until the bend at the end.",
  },
  {
    id: "momentum-trader",
    name: "The Momentum Trader",
    tagline: "Buy high, sell higher",
    glyph: "🚀",
    rarity: "Rare",
    theme: { from: "#2a0726", to: "#a01e6e", accent: "#ff48b0", ink: "#fff0fa", muted: "#f3a9d6" },
    traits: ["Breakouts", "Relative Strength", "Cut Losers Fast", "Let Winners Run"],
    stats: stats({
      "Risk Appetite": 80,
      Patience: 30,
      "Time Horizon": 35,
      Activity: 78,
      Conviction: 60,
    }),
    quote: "Strength begets strength. I buy what's already winning.",
  },
  {
    id: "contrarian",
    name: "The Contrarian",
    tagline: "Greedy when others are fearful",
    glyph: "🎯",
    rarity: "Epic",
    theme: { from: "#1c1606", to: "#6b4a0e", accent: "#ffc24d", ink: "#fff8e8", muted: "#e8cf95" },
    traits: ["Mean Reversion", "Buys Panic", "Iron Stomach", "Patient Capital"],
    stats: stats({
      "Risk Appetite": 68,
      Patience: 82,
      "Time Horizon": 70,
      Activity: 40,
      Conviction: 92,
    }),
    quote: "The crowd is the trade — I take the other side of the fear.",
  },
  {
    id: "quant",
    name: "The Quant",
    tagline: "Trust the model, not the mood",
    glyph: "🤖",
    rarity: "Epic",
    theme: { from: "#060c1c", to: "#16356e", accent: "#5aa8ff", ink: "#eef4ff", muted: "#a8c4ef" },
    traits: ["Systematic", "Backtested", "No Emotion", "Edge in Numbers"],
    stats: stats({
      "Risk Appetite": 50,
      Patience: 65,
      "Time Horizon": 50,
      Activity: 85,
      Conviction: 88,
    }),
    quote: "I don't have opinions. I have a tested expectancy.",
  },
  {
    id: "hodler",
    name: "The HODLer",
    tagline: "Diamond hands, zero exits",
    glyph: "💎",
    rarity: "Legendary",
    theme: { from: "#150a2e", to: "#5a23a8", accent: "#b388ff", ink: "#f5efff", muted: "#cdb6f0" },
    traits: ["Conviction Bet", "Ignores Noise", "Long Horizon", "Volatility = Discount"],
    stats: stats({
      "Risk Appetite": 88,
      Patience: 96,
      "Time Horizon": 92,
      Activity: 14,
      Conviction: 100,
    }),
    quote: "Time in the market. The chart is a rounding error to me.",
  },
  {
    id: "long-term-investor",
    name: "The Long-Term Investor",
    tagline: "Owning businesses, not tickers",
    glyph: "🏛️",
    rarity: "Legendary",
    theme: { from: "#0a1322", to: "#163a5e", accent: "#e8c25a", ink: "#f4f8ff", muted: "#b6c8e0" },
    traits: ["Fundamentals", "Compounding", "Buy & Hold", "Margin of Safety"],
    stats: stats({
      "Risk Appetite": 32,
      Patience: 100,
      "Time Horizon": 100,
      Activity: 12,
      Conviction: 84,
    }),
    quote: "Our favorite holding period is forever.",
  },
];

/** Look up a persona by id (case-insensitive). */
export function findPersona(id: string): Persona | undefined {
  const needle = id.trim().toLowerCase();
  return PERSONAS.find((p) => p.id === needle);
}
