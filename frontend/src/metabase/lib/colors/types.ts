import type { colorConfig } from "./colors";

/**
 * Color palette that can be customized.
 * Used for both the main app and embedding.
 */
export interface MetabaseColorsV2 {
  /** Primary brand color */
  brand: string;

  /** Primary background color  */
  "background-primary": string;

  /** Primary text color  */
  "text-primary": string;

  /** Secondary text color */
  "text-secondary": string;

  /** Tertiary text color */
  "text-tertiary": string;

  /** Primary text color */
  "text-primary-inverse": string;

  /** Secondary background color */
  "background-secondary": string;

  /** Shadow color */
  shadow: string;

  /** Border color for dividers and outlines */
  border: string;

  /** Color for query builder filter */
  filter: string;

  /** Color for query builder summarize/aggregation */
  summarize: string;

  /** Color for positive states (success, increase) */
  positive: string;

  /** Color for negative states (error, decrease) */
  negative: string;
}

/**
 * ColorPalette extends MetabaseColorsV2 with all remaining semantic color keys.
 * This type represents the complete internal color system.
 */
export type ColorPalette = MetabaseColorsV2 &
  Partial<Record<keyof typeof colorConfig, string>>;

export type ColorName = keyof typeof colorConfig;

export interface AccentColorOptions {
  main?: boolean;
  light?: boolean;
  dark?: boolean;
  harmony?: boolean;
  gray?: boolean;
}

/**
 * MetabaseThemeV2 represents the theme object for Metabase v2 theming system.
 * This interface is used for both the main app and embedding scenarios.
 */
export interface MetabaseThemeV2 {
  /** Theme version identifier */
  version: 2;

  /** Color palette */
  colors?: MetabaseColorsV2;

  /** 8 chart colors */
  chartColors?: string[];

  /** Custom font family. Currently used for React SDK. */
  fontFamily?: string;
}

/**
 * Type guard to check if a theme object is MetabaseThemeV2.
 * @param theme - The theme object to check
 * @returns true if the theme is MetabaseThemeV2, false otherwise
 */
export const isMetabaseThemeV2 = (theme: unknown): theme is MetabaseThemeV2 =>
  typeof theme === "object" &&
  theme !== null &&
  "version" in theme &&
  theme.version === 2;

/**
 * Type guard to check if a theme object is MetabaseThemeV1 (legacy theme without version field).
 * @param theme - The theme object to check
 * @returns true if the theme is MetabaseThemeV1 (no version field or version !== 2), false otherwise
 */
export const isMetabaseThemeV1 = (theme: unknown): boolean =>
  typeof theme === "object" &&
  theme !== null &&
  (!("version" in theme) || theme.version !== 2);
