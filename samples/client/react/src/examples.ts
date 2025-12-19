/**
 * A2UI Example Specs
 * Demonstrating various component patterns
 */

import type { A2UIComponentSpec } from '@a2ui/react';

// =============================================================================
// FLASHCARD EXAMPLE
// =============================================================================

export const flashcardSpec: A2UIComponentSpec = {
  component: 'Card',
  id: 'flashcard',
  child: {
    component: 'Column',
    children: [
      {
        component: 'Text',
        text: { path: 'card.word' },
        usageHint: 'h2',
      },
      {
        component: 'Text',
        text: { path: 'card.reading' },
        usageHint: 'caption',
      },
      {
        component: 'Divider',
        axis: 'horizontal',
      },
      {
        component: 'Text',
        text: { path: 'card.meaning' },
        usageHint: 'body',
      },
      {
        component: 'Row',
        distribution: 'spaceEvenly',
        children: [
          {
            component: 'Button',
            primary: false,
            child: { component: 'Text', text: 'Again' },
            action: { type: 'flashcard', name: 'answer', params: { quality: 0 } },
          },
          {
            component: 'Button',
            primary: false,
            child: { component: 'Text', text: 'Hard' },
            action: { type: 'flashcard', name: 'answer', params: { quality: 2 } },
          },
          {
            component: 'Button',
            primary: true,
            child: { component: 'Text', text: 'Good' },
            action: { type: 'flashcard', name: 'answer', params: { quality: 4 } },
          },
          {
            component: 'Button',
            primary: false,
            child: { component: 'Text', text: 'Easy' },
            action: { type: 'flashcard', name: 'answer', params: { quality: 5 } },
          },
        ],
      },
    ],
  },
};

export const flashcardData = {
  card: {
    word: '食べる',
    reading: 'たべる',
    meaning: 'to eat',
  },
};

// =============================================================================
// DASHBOARD EXAMPLE
// =============================================================================

export const dashboardSpec: A2UIComponentSpec = {
  component: 'Column',
  id: 'dashboard',
  children: [
    {
      component: 'Text',
      text: 'Learning Dashboard',
      usageHint: 'h1',
    },
    {
      component: 'Row',
      distribution: 'spaceEvenly',
      children: [
        {
          component: 'Card',
          child: {
            component: 'Column',
            alignment: 'center',
            children: [
              { component: 'Icon', name: 'calendar' },
              { component: 'Text', text: { path: 'stats.streak' }, usageHint: 'h2' },
              { component: 'Text', text: 'Day Streak', usageHint: 'caption' },
            ],
          },
        },
        {
          component: 'Card',
          child: {
            component: 'Column',
            alignment: 'center',
            children: [
              { component: 'Icon', name: 'check' },
              { component: 'Text', text: { path: 'stats.reviewed' }, usageHint: 'h2' },
              { component: 'Text', text: 'Cards Reviewed', usageHint: 'caption' },
            ],
          },
        },
        {
          component: 'Card',
          child: {
            component: 'Column',
            alignment: 'center',
            children: [
              { component: 'Icon', name: 'star' },
              { component: 'Text', text: { path: 'stats.accuracy' }, usageHint: 'h2' },
              { component: 'Text', text: 'Accuracy', usageHint: 'caption' },
            ],
          },
        },
      ],
    },
    {
      component: 'Divider',
      axis: 'horizontal',
    },
    {
      component: 'Text',
      text: 'Recent Words',
      usageHint: 'h3',
    },
    {
      component: 'List',
      direction: 'vertical',
      items: { path: 'recentWords' },
      itemTemplate: {
        component: 'Card',
        child: {
          component: 'Row',
          distribution: 'spaceBetween',
          alignment: 'center',
          children: [
            {
              component: 'Column',
              children: [
                { component: 'Text', text: { path: 'item.word' }, usageHint: 'h4' },
                { component: 'Text', text: { path: 'item.meaning' }, usageHint: 'caption' },
              ],
            },
            {
              component: 'Text',
              text: { path: 'item.level' },
              usageHint: 'caption',
            },
          ],
        },
      },
    },
  ],
};

export const dashboardData = {
  stats: {
    streak: '7',
    reviewed: '42',
    accuracy: '85%',
  },
  recentWords: [
    { word: '食べる', meaning: 'to eat', level: 'N5' },
    { word: '飲む', meaning: 'to drink', level: 'N5' },
    { word: '見る', meaning: 'to see', level: 'N5' },
    { word: '聞く', meaning: 'to hear', level: 'N5' },
  ],
};

// =============================================================================
// FORM EXAMPLE
// =============================================================================

export const formSpec: A2UIComponentSpec = {
  component: 'Card',
  id: 'settings-form',
  child: {
    component: 'Column',
    children: [
      {
        component: 'Text',
        text: 'Settings',
        usageHint: 'h2',
      },
      {
        component: 'TextField',
        label: 'Display Name',
        text: { path: 'settings.displayName' },
        usageHint: 'shortText',
        onChange: { type: 'settings', name: 'update', params: { field: 'displayName' } },
      },
      {
        component: 'ChoicePicker',
        label: 'Theme',
        usageHint: 'mutuallyExclusive',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'System', value: 'system' },
        ],
        value: { path: 'settings.theme' },
        onChange: { type: 'settings', name: 'update', params: { field: 'theme' } },
      },
      {
        component: 'Slider',
        label: 'Cards per Session',
        min: 5,
        max: 50,
        step: 5,
        value: { path: 'settings.cardsPerSession' },
        onChange: { type: 'settings', name: 'update', params: { field: 'cardsPerSession' } },
      },
      {
        component: 'CheckBox',
        label: 'Enable notifications',
        value: { path: 'settings.notifications' },
        onChange: { type: 'settings', name: 'update', params: { field: 'notifications' } },
      },
      {
        component: 'Divider',
        axis: 'horizontal',
      },
      {
        component: 'Row',
        distribution: 'end',
        children: [
          {
            component: 'Button',
            primary: false,
            child: { component: 'Text', text: 'Cancel' },
            action: { type: 'settings', name: 'cancel' },
          },
          {
            component: 'Button',
            primary: true,
            child: { component: 'Text', text: 'Save' },
            action: { type: 'settings', name: 'save' },
          },
        ],
      },
    ],
  },
};

export const formData = {
  settings: {
    displayName: 'User',
    theme: 'system',
    cardsPerSession: 20,
    notifications: true,
  },
};

// =============================================================================
// TABS EXAMPLE
// =============================================================================

export const tabsSpec: A2UIComponentSpec = {
  component: 'Tabs',
  id: 'main-tabs',
  tabItems: [
    {
      title: 'Flashcard',
      child: flashcardSpec,
    },
    {
      title: 'Dashboard',
      child: dashboardSpec,
    },
    {
      title: 'Settings',
      child: formSpec,
    },
  ],
};

export const tabsData = {
  ...flashcardData,
  ...dashboardData,
  ...formData,
};

// =============================================================================
// MODAL EXAMPLE
// =============================================================================

export const modalSpec: A2UIComponentSpec = {
  component: 'Modal',
  id: 'help-modal',
  title: 'Keyboard Shortcuts',
  entryPointChild: {
    component: 'Button',
    primary: false,
    child: {
      component: 'Row',
      distribution: 'center',
      alignment: 'center',
      children: [
        { component: 'Icon', name: 'info' },
        { component: 'Text', text: 'Help' },
      ],
    },
    action: { type: 'ui', name: 'openModal' },
  },
  contentChild: {
    component: 'Column',
    children: [
      {
        component: 'List',
        direction: 'vertical',
        children: [
          {
            component: 'Row',
            distribution: 'spaceBetween',
            children: [
              { component: 'Text', text: 'Space' },
              { component: 'Text', text: 'Flip card', usageHint: 'caption' },
            ],
          },
          {
            component: 'Row',
            distribution: 'spaceBetween',
            children: [
              { component: 'Text', text: '1-4' },
              { component: 'Text', text: 'Rate card', usageHint: 'caption' },
            ],
          },
          {
            component: 'Row',
            distribution: 'spaceBetween',
            children: [
              { component: 'Text', text: 'Esc' },
              { component: 'Text', text: 'Skip card', usageHint: 'caption' },
            ],
          },
        ],
      },
    ],
  },
};

// =============================================================================
// ALL COMPONENTS SHOWCASE
// =============================================================================

export const showcaseSpec: A2UIComponentSpec = {
  component: 'Column',
  id: 'showcase',
  children: [
    { component: 'Text', text: 'A2UI Component Showcase', usageHint: 'h1' },

    // Typography
    { component: 'Text', text: 'Typography', usageHint: 'h2' },
    { component: 'Card', child: {
      component: 'Column',
      children: [
        { component: 'Text', text: 'Heading 1', usageHint: 'h1' },
        { component: 'Text', text: 'Heading 2', usageHint: 'h2' },
        { component: 'Text', text: 'Heading 3', usageHint: 'h3' },
        { component: 'Text', text: 'Heading 4', usageHint: 'h4' },
        { component: 'Text', text: 'Heading 5', usageHint: 'h5' },
        { component: 'Text', text: 'Body text - The quick brown fox jumps over the lazy dog.', usageHint: 'body' },
        { component: 'Text', text: 'Caption text - Additional context or metadata', usageHint: 'caption' },
      ],
    }},

    { component: 'Divider', axis: 'horizontal' },

    // Buttons & Icons
    { component: 'Text', text: 'Buttons & Icons', usageHint: 'h2' },
    { component: 'Card', child: {
      component: 'Row',
      distribution: 'start',
      children: [
        { component: 'Button', primary: true, child: { component: 'Text', text: 'Primary' }, action: { type: 'demo', name: 'click' } },
        { component: 'Button', primary: false, child: { component: 'Text', text: 'Secondary' }, action: { type: 'demo', name: 'click' } },
        { component: 'Button', primary: false, child: {
          component: 'Row',
          alignment: 'center',
          children: [
            { component: 'Icon', name: 'star' },
            { component: 'Text', text: 'With Icon' },
          ],
        }, action: { type: 'demo', name: 'click' } },
      ],
    }},

    { component: 'Card', child: {
      component: 'Row',
      distribution: 'spaceEvenly',
      children: [
        { component: 'Icon', name: 'home' },
        { component: 'Icon', name: 'settings' },
        { component: 'Icon', name: 'user' },
        { component: 'Icon', name: 'search' },
        { component: 'Icon', name: 'star' },
        { component: 'Icon', name: 'heart' },
        { component: 'Icon', name: 'check' },
        { component: 'Icon', name: 'close' },
        { component: 'Icon', name: 'play' },
        { component: 'Icon', name: 'calendar' },
      ],
    }},

    { component: 'Divider', axis: 'horizontal' },

    // Form Controls
    { component: 'Text', text: 'Form Controls', usageHint: 'h2' },
    { component: 'Card', child: {
      component: 'Column',
      children: [
        { component: 'TextField', label: 'Short text', usageHint: 'shortText', text: 'Hello world' },
        { component: 'TextField', label: 'Long text', usageHint: 'longText', text: '' },
        { component: 'CheckBox', label: 'Enable feature', value: true },
        { component: 'Slider', label: 'Volume', min: 0, max: 100, step: 1, value: 50 },
        { component: 'ChoicePicker', label: 'Select option', usageHint: 'mutuallyExclusive', options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ], value: 'b' },
      ],
    }},

    { component: 'Divider', axis: 'horizontal' },

    // Media
    { component: 'Text', text: 'Media', usageHint: 'h2' },
    { component: 'Card', child: {
      component: 'Row',
      distribution: 'start',
      alignment: 'center',
      children: [
        { component: 'Image', url: 'https://picsum.photos/64/64', usageHint: 'avatar' },
        { component: 'Image', url: 'https://picsum.photos/120/80', usageHint: 'smallFeature' },
        { component: 'Image', url: 'https://picsum.photos/200/120', usageHint: 'mediumFeature' },
      ],
    }},
  ],
};
