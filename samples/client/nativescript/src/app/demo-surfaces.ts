import { Types } from '../a2ui-lit-types';

/**
 * Demo surfaces for showcasing A2UI capabilities.
 * These are used when no backend server is connected.
 */

export const DEMO_WELCOME_SURFACE: Types.A2uiMessage = {
  root: {
    type: 'Column',
    id: 'welcome-root',
    children: [
      {
        type: 'Card',
        id: 'welcome-card',
        title: 'Welcome to A2UI',
        subtitle: 'Agent-to-User Interface',
        children: [
          {
            type: 'Text',
            id: 'welcome-text',
            text: 'A2UI enables AI agents to generate rich, interactive user interfaces that work across any platform.',
            textStyle: 'body',
          },
          {
            type: 'Spacer',
            id: 'spacer-1',
            height: 16,
          },
          {
            type: 'Row',
            id: 'action-row',
            children: [
              {
                type: 'Button',
                id: 'learn-more-btn',
                label: 'Learn More',
                variant: 'primary',
                action: { name: 'learnMore' },
              },
              {
                type: 'Button',
                id: 'try-demo-btn',
                label: 'Try Demo',
                variant: 'secondary',
                action: { name: 'tryDemo' },
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

export const DEMO_RESTAURANT_SURFACE: Types.A2uiMessage = {
  root: {
    type: 'Column',
    id: 'restaurant-root',
    children: [
      {
        type: 'Text',
        id: 'restaurant-title',
        text: '🍕 Restaurant Finder',
        textStyle: 'title',
      },
      {
        type: 'Spacer',
        id: 'spacer-top',
        height: 12,
      },
      {
        type: 'Card',
        id: 'restaurant-1',
        title: 'La Piazza Italiana',
        subtitle: '⭐ 4.8 • Italian • $$',
        children: [
          {
            type: 'Text',
            id: 'restaurant-1-desc',
            text: 'Authentic Italian cuisine in a cozy atmosphere. Known for fresh pasta and wood-fired pizzas.',
            textStyle: 'body',
          },
        ],
        actions: [
          { name: 'viewDetails', id: 'view-1', label: 'View' },
          { name: 'reserve', id: 'reserve-1', label: 'Reserve' },
        ],
      },
      {
        type: 'Card',
        id: 'restaurant-2',
        title: 'Sakura Garden',
        subtitle: '⭐ 4.6 • Japanese • $$$',
        children: [
          {
            type: 'Text',
            id: 'restaurant-2-desc',
            text: 'Premium sushi and traditional Japanese dishes. Omakase experience available.',
            textStyle: 'body',
          },
        ],
        actions: [
          { name: 'viewDetails', id: 'view-2', label: 'View' },
          { name: 'reserve', id: 'reserve-2', label: 'Reserve' },
        ],
      },
      {
        type: 'Card',
        id: 'restaurant-3',
        title: 'The Spice Route',
        subtitle: '⭐ 4.7 • Indian • $$',
        children: [
          {
            type: 'Text',
            id: 'restaurant-3-desc',
            text: 'Rich flavors from across India. Vegetarian-friendly with vegan options.',
            textStyle: 'body',
          },
        ],
        actions: [
          { name: 'viewDetails', id: 'view-3', label: 'View' },
          { name: 'reserve', id: 'reserve-3', label: 'Reserve' },
        ],
      },
    ],
  } as Types.Node,
};

export const DEMO_CONTACT_SURFACE: Types.A2uiMessage = {
  root: {
    type: 'Column',
    id: 'contact-root',
    children: [
      {
        type: 'Text',
        id: 'contact-title',
        text: '📇 Contact Details',
        textStyle: 'title',
      },
      {
        type: 'Spacer',
        id: 'spacer-1',
        height: 16,
      },
      {
        type: 'Card',
        id: 'contact-card',
        children: [
          {
            type: 'Row',
            id: 'contact-header',
            children: [
              {
                type: 'Text',
                id: 'contact-avatar',
                text: '👤',
                textStyle: 'title',
              },
              {
                type: 'Column',
                id: 'contact-info',
                children: [
                  {
                    type: 'Text',
                    id: 'contact-name',
                    text: 'John Smith',
                    textStyle: 'subtitle',
                  },
                  {
                    type: 'Text',
                    id: 'contact-role',
                    text: 'Software Engineer at Google',
                    textStyle: 'body',
                  },
                ],
              },
            ],
          },
          {
            type: 'Divider',
            id: 'divider-1',
          },
          {
            type: 'Row',
            id: 'contact-email-row',
            children: [
              {
                type: 'Text',
                id: 'email-label',
                text: '📧',
              },
              {
                type: 'Text',
                id: 'email-value',
                text: 'john.smith@example.com',
                textStyle: 'body',
              },
            ],
          },
          {
            type: 'Row',
            id: 'contact-phone-row',
            children: [
              {
                type: 'Text',
                id: 'phone-label',
                text: '📱',
              },
              {
                type: 'Text',
                id: 'phone-value',
                text: '+1 (555) 123-4567',
                textStyle: 'body',
              },
            ],
          },
        ],
        actions: [
          { name: 'call', id: 'call-btn', label: 'Call' },
          { name: 'message', id: 'message-btn', label: 'Message' },
        ],
      },
    ],
  } as Types.Node,
};

export const DEMO_CHART_SURFACE: Types.A2uiMessage = {
  root: {
    type: 'Column',
    id: 'chart-root',
    children: [
      {
        type: 'Text',
        id: 'chart-title',
        text: '📊 Analytics Dashboard',
        textStyle: 'title',
      },
      {
        type: 'Spacer',
        id: 'spacer-1',
        height: 12,
      },
      {
        type: 'Row',
        id: 'stats-row',
        children: [
          {
            type: 'Card',
            id: 'stat-1',
            title: '12.5K',
            subtitle: 'Total Users',
            children: [
              {
                type: 'Text',
                id: 'stat-1-change',
                text: '↑ 12% from last month',
                textStyle: 'caption',
              },
            ],
          },
          {
            type: 'Card',
            id: 'stat-2',
            title: '3.2K',
            subtitle: 'Active Today',
            children: [
              {
                type: 'Text',
                id: 'stat-2-change',
                text: '↑ 8% from yesterday',
                textStyle: 'caption',
              },
            ],
          },
        ],
      },
      {
        type: 'Card',
        id: 'chart-card',
        title: 'Weekly Activity',
        children: [
          {
            type: 'Row',
            id: 'chart-bars',
            horizontalAlignment: 'spaceAround',
            children: [
              { type: 'Text', id: 'bar-1', text: '▓▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-2', text: '▓▓▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-3', text: '▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-4', text: '▓▓▓▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-5', text: '▓▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-6', text: '▓▓▓▓', textStyle: 'code' },
              { type: 'Text', id: 'bar-7', text: '▓▓', textStyle: 'code' },
            ],
          },
          {
            type: 'Row',
            id: 'chart-labels',
            horizontalAlignment: 'spaceAround',
            children: [
              { type: 'Text', id: 'label-1', text: 'Mon', textStyle: 'caption' },
              { type: 'Text', id: 'label-2', text: 'Tue', textStyle: 'caption' },
              { type: 'Text', id: 'label-3', text: 'Wed', textStyle: 'caption' },
              { type: 'Text', id: 'label-4', text: 'Thu', textStyle: 'caption' },
              { type: 'Text', id: 'label-5', text: 'Fri', textStyle: 'caption' },
              { type: 'Text', id: 'label-6', text: 'Sat', textStyle: 'caption' },
              { type: 'Text', id: 'label-7', text: 'Sun', textStyle: 'caption' },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// Demo responses for different queries
export function getDemoResponse(query: string): { text: string; surface?: Types.A2uiMessage } {
  const q = query.toLowerCase();
  
  if (q.includes('restaurant') || q.includes('food') || q.includes('eat') || q.includes('dinner')) {
    return {
      text: 'I found some great restaurants near you! Here are my top recommendations:',
      surface: DEMO_RESTAURANT_SURFACE,
    };
  }
  
  if (q.includes('contact') || q.includes('john') || q.includes('smith') || q.includes('person')) {
    return {
      text: 'Here\'s the contact information you requested:',
      surface: DEMO_CONTACT_SURFACE,
    };
  }
  
  if (q.includes('analytics') || q.includes('chart') || q.includes('stats') || q.includes('dashboard')) {
    return {
      text: 'Here\'s your analytics dashboard with the latest data:',
      surface: DEMO_CHART_SURFACE,
    };
  }
  
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return {
      text: 'Hello! 👋 I\'m your A2UI demo agent. Try asking me about restaurants, contacts, or analytics to see interactive UI surfaces!',
      surface: DEMO_WELCOME_SURFACE,
    };
  }
  
  if (q.includes('help') || q.includes('what can you do')) {
    return {
      text: 'I can demonstrate A2UI\'s capabilities! Try these:\n\n• "Find restaurants nearby"\n• "Show me John Smith\'s contact"\n• "Show analytics dashboard"\n\nEach will display an interactive UI surface!',
    };
  }
  
  // Default response
  return {
    text: 'I received your message! In a production environment, I would connect to an A2A server powered by Gemini or another AI. For now, try:\n\n• "Find restaurants"\n• "Show contact"\n• "Analytics dashboard"',
  };
}
