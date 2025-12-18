import { AppConfig } from './types';

export const config: AppConfig = {
  key: 'contacts',
  title: 'Contact Manager',
  background: `radial-gradient(at 0% 0%, light-dark(rgba(45, 212, 191, 0.4), rgba(20, 184, 166, 0.2)) 0px, transparent 50%),
     radial-gradient(at 100% 0%, light-dark(rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.2)) 0px, transparent 50%),
     radial-gradient(at 100% 100%, light-dark(rgba(163, 230, 53, 0.4), rgba(132, 204, 22, 0.2)) 0px, transparent 50%),
     radial-gradient(at 0% 100%, light-dark(rgba(52, 211, 153, 0.4), rgba(16, 185, 129, 0.2)) 0px, transparent 50%),
     linear-gradient(120deg, light-dark(#f0fdf4, #022c22) 0%, light-dark(#dcfce7, #064e3b) 100%)`,
  placeholder: 'Alex Jordan',
  loadingText: [
    'Searching contacts...',
    'Looking up details...',
    'Verifying information...',
    'Just a moment...',
  ],
  serverUrl: 'http://localhost:10003',
};

