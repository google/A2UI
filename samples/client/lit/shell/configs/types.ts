import { v0_8 } from "@a2ui/web-lib";

/**
 * Configuration interface for the Universal App Shell.
 */
export interface AppConfig {
  /** Unique key for the app (e.g., 'restaurant', 'contacts') */
  key: string;
  /** Display title of the application */
  title: string;
  /** The background for the page */
  background?: string;
  /** Path to the hero image */
  heroImage?: string;
  /** Path to the hero image */
  heroImageDark?: string;
  /** Placeholder text for the input field */
  placeholder: string;
  /** Text to display while loading (optional). Can be a single string or an array of strings to rotate. */
  loadingText?: string | string[];
  /** Optional server URL for the agent (e.g., http://localhost:10003) */
  serverUrl?: string;
  /** Theme overrides (CSS Variables) */
  theme?: v0_8.Types.Theme;
}
