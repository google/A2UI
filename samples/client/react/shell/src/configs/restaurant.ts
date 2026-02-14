import { AppConfig } from './types';

export const config: AppConfig = {
  key: 'restaurant',
  title: 'Restaurant Finder',
  heroImage: '/hero.png',
  heroImageDark: '/hero-dark.png',
  background: `radial-gradient(
    at 0% 0%,
    light-dark(rgba(161, 196, 253, 0.3), rgba(6, 182, 212, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 0%,
    light-dark(rgba(255, 226, 226, 0.3), rgba(59, 130, 246, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 100% 100%,
    light-dark(rgba(162, 210, 255, 0.3), rgba(20, 184, 166, 0.15)) 0px,
    transparent 50%
  ),
  radial-gradient(
    at 0% 100%,
    light-dark(rgba(255, 200, 221, 0.3), rgba(99, 102, 241, 0.15)) 0px,
    transparent 50%
  ),
  linear-gradient(
    120deg,
    light-dark(#f0f4f8, #0f172a) 0%,
    light-dark(#e2e8f0, #1e293b) 100%
  )`,
  placeholder: 'Top 5 Chinese restaurants in New York.',
  loadingText: [
    'Finding the best spots for you...',
    'Checking reviews...',
    'Looking for open tables...',
    'Almost there...',
  ],
  serverUrl: 'http://localhost:10002',
};
