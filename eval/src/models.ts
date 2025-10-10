// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';
import { claude35Haiku, claude4Sonnet } from 'genkitx-anthropic';

export interface ModelConfiguration {
  model: any;
  name: string;
  apiProvider: 'openai' | 'google' | 'anthropic';
  config?: any;
}

export const modelsToTest: ModelConfiguration[] = [
  {
    model: openAI.model('gpt-5'),
    name: 'gpt-5 (reasoning: minimal)',
    apiProvider: 'openai',
    config: { reasoning_effort: 'minimal' },
  },
  {
    model: openAI.model('gpt-5-mini'),
    name: 'gpt-5-mini (reasoning: minimal)',
    apiProvider: 'openai',
    config: { reasoning_effort: 'minimal' },
  },
  {
    model: openAI.model('gpt-4.1'),
    name: 'gpt-4.1',
    apiProvider: 'openai',
    config: {},
  },
  {
    model: googleAI.model('gemini-2.5-pro'),
    name: 'gemini-2.5-pro (thinking: 1000)',
    apiProvider: 'google',
    config: { thinkingConfig: { thinkingBudget: 1000 } },
  },
  {
    model: googleAI.model('gemini-2.5-flash'),
    name: 'gemini-2.5-flash (thinking: 0)',
    apiProvider: 'google',
    config: { thinkingConfig: { thinkingBudget: 0 } },
  },
  {
    model: googleAI.model('gemini-2.5-flash-lite'),
    name: 'gemini-2.5-flash-lite (thinking: 0)',
    apiProvider: 'google',
    config: { thinkingConfig: { thinkingBudget: 0 } },
  },
  {
    model: claude4Sonnet,
    name: 'claude-3-sonnet',
    apiProvider: 'anthropic',
    config: {},
  },
  {
    model: claude35Haiku,
    name: 'claude-3-haiku',
    apiProvider: 'anthropic',
    config: {},
  },
];
