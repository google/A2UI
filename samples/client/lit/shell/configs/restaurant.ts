import { AppConfig } from './types.js';

export const config: AppConfig = {
  key: 'restaurant',
  title: 'Restaurant Finder',
  heroImage: '/hero.png',
  heroImageDark: '/hero-dark.png',
  placeholder: 'Top 5 Chinese restaurants in New York.',
  loadingText: [
    'Finding the best spots for you...',
    'Checking reviews...',
    'Looking for open tables...',
    'Almost there...'
  ],
  serverUrl: 'http://localhost:10002',
  theme: {
    // Restaurant Theme (Blue/Purple/Cyan)
    '--primary-hue': '230', // Example if we were using HSL, but we are using specific colors for now.
    // We can override specific variables if needed, but the default "Elegant" theme is already the Restaurant theme.
    // So we might not need many overrides here unless we want to be explicit.
  }
};
