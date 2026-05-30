/**
 * Predefined trading-persona archetypes — Binance-app styled.
 *
 * Each archetype is a self-contained description of a recognizable trader
 * "type" rendered as a Binance-style asset card: a trading pair, a 24h change
 * badge, a candlestick spark, and a set of normalized stats (0–100).
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

/** Market sentiment — drives candle bias and the up/down (green/red) coloring. */
export type Sentiment = "bull" | "bear" | "neutral";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface Persona {
  /** Stable kebab-case id; also the output filename. */
  id: string;
  /** Display name of the archetype. */
  name: string;
  /** One-line subtitle under the name. */
  tagline: string;
  /** 3–5 char ticker symbol, Binance-style (paired with USDT on the card). */
  ticker: string;
  /** Synthetic "24h change" percentage; sign drives green/up vs red/down. */
  change: number;
  /** Single emoji used as the asset glyph. */
  glyph: string;
  /** Collectible-style rarity tag. */
  rarity: Rarity;
  /** Candle/price-direction bias. */
  sentiment: Sentiment;
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
    ticker: "DAYT",
    change: 0.42,
    glyph: "📈",
    rarity: "Uncommon",
    sentiment: "neutral",
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
    ticker: "SCLP",
    change: 0.18,
    glyph: "⚡",
    rarity: "Rare",
    sentiment: "bull",
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
    ticker: "SWNG",
    change: 6.40,
    glyph: "🌊",
    rarity: "Common",
    sentiment: "bull",
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
    ticker: "MOMO",
    change: 24.70,
    glyph: "🚀",
    rarity: "Rare",
    sentiment: "bull",
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
    ticker: "CNTR",
    change: -8.30,
    glyph: "🎯",
    rarity: "Epic",
    sentiment: "bear",
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
    ticker: "QNT",
    change: 1.32,
    glyph: "🤖",
    rarity: "Epic",
    sentiment: "neutral",
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
    ticker: "HODL",
    change: 318.0,
    glyph: "💎",
    rarity: "Legendary",
    sentiment: "bull",
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
    ticker: "LONG",
    change: 1240.0,
    glyph: "🏛️",
    rarity: "Legendary",
    sentiment: "bull",
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
