import { AppConfig } from './types.js';

export const config: AppConfig = {
  key: 'contacts',
  title: 'Contact Manager',
  heroImage: '/hero.png', // We can use the same hero for now or a different one if available
  placeholder: 'Alex Jordan',
  loadingText: [
    'Searching contacts...',
    'Looking up details...',
    'Verifying information...',
    'Just a moment...'
  ],
  serverUrl: 'http://localhost:10003',
  theme: {
    // Contacts Theme (Teal/Green/Emerald)
    // Overriding the primary colors to give it a distinct look
    '--primary-color': 'light-dark(#10b981, #34d399)', // Emerald 500/400
    '--primary-gradient': 'linear-gradient(135deg, light-dark(#10b981, #34d399) 0%, light-dark(#059669, #059669) 100%)',
    '--button-text': '#ffffff',
    '--bg-gradient': `
      radial-gradient(at 0% 0%, light-dark(rgba(45, 212, 191, 0.4), rgba(20, 184, 166, 0.2)) 0px, transparent 50%),
      radial-gradient(at 100% 0%, light-dark(rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.2)) 0px, transparent 50%),
      radial-gradient(at 100% 100%, light-dark(rgba(163, 230, 53, 0.4), rgba(132, 204, 22, 0.2)) 0px, transparent 50%),
      radial-gradient(at 0% 100%, light-dark(rgba(52, 211, 153, 0.4), rgba(16, 185, 129, 0.2)) 0px, transparent 50%),
      linear-gradient(120deg, light-dark(#f0fdf4, #022c22) 0%, light-dark(#dcfce7, #064e3b) 100%)
    `,
  }
};
