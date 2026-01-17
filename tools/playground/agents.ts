/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * A2UI Labs - Agent Registry
 * 
 * Central registry for AI agents that can be used in the playground.
 * Supports built-in (Gemini-based), remote (SSE/A2A), and MCP agents.
 */

import { Template, TEMPLATES } from "./templates.js";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AgentType = 'builtin' | 'custom' | 'remote';

export interface GeminiConfig {
    model: string;
    systemPrompt: string;
    temperature?: number;
}

export interface RemoteConfig {
    endpoint: string;
    authType?: 'none' | 'api-key' | 'bearer';
    authValue?: string;
}

export interface McpConfig {
    serverUrl: string;
}

export interface AgentConfig {
    gemini?: GeminiConfig;
    remote?: RemoteConfig;
    mcp?: McpConfig;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    icon: string;              // Material icon name
    thumbnail?: string;        // Preview image URL
    type: AgentType;
    category?: string;         // e.g., 'creative', 'productivity', 'finance'
    config: AgentConfig;
    templates?: Template[];    // Agent-specific templates for gallery
    createdAt?: number;        // Timestamp for custom agents
}

// ============================================================================
// Built-in Agents
// ============================================================================

const WEB_DESIGNER_PROMPT = `You are a professional web designer AI assistant that creates modern, beautiful websites using the A2UI protocol.

When a user describes a website or component, you generate A2UI JSON that renders it.

## Response Format
Always respond with:
1. A brief text explanation (1-2 sentences)
2. Valid A2UI JSONL messages

## A2UI Structure
- Use Column for vertical layouts, Row for horizontal
- Use Heading, Text, Button, Image, TextField, CheckBox, Divider
- For "Image" components, use https://loremflickr.com/600/400/keyword for specific items or https://placehold.co/600x400?text=Description for generic placeholders

## Design Principles
- Modern, clean aesthetics
- Consistent spacing and typography
- Responsive-friendly layouts`;

const VISUAL_ARTIST_PROMPT = `You are a visual artist AI that creates beautiful vector illustrations using the A2UI Canvas component.

## Available SVG Components
Inside a "Canvas", you can use:
- Rectangle: { x, y, width, height, fill, stroke, strokeWidth, rx }
- Circle: { cx, cy, r, fill, stroke, strokeWidth }
- Line: { x1, y1, x2, y2, stroke, strokeWidth }
- Path: { d, fill, stroke, strokeWidth }
- Text: { x, y, text, fontSize, fill, fontFamily }

## Response Format
1. Brief artistic description
2. A2UI JSONL with Canvas and shape components

## Style Guidelines
- Use harmonious color palettes
- Create balanced compositions
- Apply geometric precision`;

const TRIVIA_BOT_PROMPT = `You are a fun trivia game host! Create interactive quiz experiences using A2UI.

## Game Components
- Use Heading for questions
- Use MultipleChoice or Button components for answers
- Use Text for feedback and scoring
- Use Row/Column for layout

## Response Format
1. Engaging game text
2. A2UI JSONL for interactive quiz UI

Keep it fun, educational, and visually appealing!`;

export const BUILTIN_AGENTS: Agent[] = [
    {
        id: 'web-designer',
        name: 'Web Designer',
        description: 'Create modern, beautiful websites and UI components',
        icon: 'web',
        type: 'builtin',
        category: 'creative',
        config: {
            gemini: {
                model: 'gemini-2.0-flash',
                systemPrompt: WEB_DESIGNER_PROMPT,
                temperature: 0.7
            }
        },
        templates: TEMPLATES  // Web Designer gets all templates
    },
    {
        id: 'visual-artist',
        name: 'Visual Artist',
        description: 'Create vector illustrations and SVG artwork',
        icon: 'palette',
        type: 'builtin',
        category: 'creative',
        config: {
            gemini: {
                model: 'gemini-2.0-flash',
                systemPrompt: VISUAL_ARTIST_PROMPT,
                temperature: 0.8
            }
        },
        templates: [
            {
                id: 'geometric-pattern',
                name: 'Geometric Pattern',
                category: 'portfolio',
                description: 'Colorful geometric shapes arrangement',
                icon: 'interests',
                gradientColors: ['#667eea', '#764ba2'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Canvas: { width: 400, height: 400, children: { explicitList: ['rect1', 'rect2', 'circle1', 'circle2', 'line1'] } } } },
                                { id: 'rect1', component: { Rectangle: { x: 50, y: 50, width: 100, height: 100, fill: '#667eea', rx: 10 } } },
                                { id: 'rect2', component: { Rectangle: { x: 200, y: 100, width: 80, height: 150, fill: '#764ba2', rx: 5 } } },
                                { id: 'circle1', component: { Circle: { cx: 150, cy: 300, r: 60, fill: '#f093fb' } } },
                                { id: 'circle2', component: { Circle: { cx: 320, cy: 280, r: 40, fill: '#38ef7d', stroke: '#11998e', strokeWidth: 3 } } },
                                { id: 'line1', component: { Line: { x1: 50, y1: 200, x2: 350, y2: 200, stroke: '#4facfe', strokeWidth: 4 } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            },
            {
                id: 'simple-landscape',
                name: 'Simple Landscape',
                category: 'portfolio',
                description: 'Minimalist landscape with sun and hills',
                icon: 'landscape',
                gradientColors: ['#11998e', '#38ef7d'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Canvas: { width: 400, height: 300, children: { explicitList: ['sky', 'sun', 'hill1', 'hill2', 'ground'] } } } },
                                { id: 'sky', component: { Rectangle: { x: 0, y: 0, width: 400, height: 200, fill: '#87CEEB' } } },
                                { id: 'sun', component: { Circle: { cx: 320, cy: 60, r: 40, fill: '#FFD700' } } },
                                { id: 'hill1', component: { Path: { d: 'M0 200 Q100 120 200 200 Z', fill: '#228B22' } } },
                                { id: 'hill2', component: { Path: { d: 'M150 200 Q280 100 400 200 Z', fill: '#2E8B57' } } },
                                { id: 'ground', component: { Rectangle: { x: 0, y: 200, width: 400, height: 100, fill: '#90EE90' } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            },
            {
                id: 'abstract-circles',
                name: 'Abstract Circles',
                category: 'portfolio',
                description: 'Overlapping colorful circles',
                icon: 'blur_circular',
                gradientColors: ['#f093fb', '#f5576c'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Canvas: { width: 400, height: 400, children: { explicitList: ['c1', 'c2', 'c3', 'c4', 'c5'] } } } },
                                { id: 'c1', component: { Circle: { cx: 150, cy: 150, r: 80, fill: 'rgba(102, 126, 234, 0.7)' } } },
                                { id: 'c2', component: { Circle: { cx: 250, cy: 150, r: 80, fill: 'rgba(118, 75, 162, 0.7)' } } },
                                { id: 'c3', component: { Circle: { cx: 200, cy: 220, r: 80, fill: 'rgba(240, 147, 251, 0.7)' } } },
                                { id: 'c4', component: { Circle: { cx: 120, cy: 280, r: 50, fill: 'rgba(56, 239, 125, 0.7)' } } },
                                { id: 'c5', component: { Circle: { cx: 300, cy: 300, r: 60, fill: 'rgba(79, 172, 254, 0.7)' } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            }
        ]
    },
    {
        id: 'trivia-bot',
        name: 'Trivia Bot',
        description: 'Interactive trivia games and quizzes',
        icon: 'quiz',
        type: 'builtin',
        category: 'entertainment',
        config: {
            gemini: {
                model: 'gemini-2.0-flash',
                systemPrompt: TRIVIA_BOT_PROMPT,
                temperature: 0.9
            }
        },
        templates: [
            {
                id: 'multiple-choice-quiz',
                name: 'Multiple Choice Quiz',
                category: 'form',
                description: 'Classic 4-option trivia question',
                icon: 'quiz',
                gradientColors: ['#4facfe', '#00f2fe'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Column: { children: { explicitList: ['header', 'question', 'options', 'submit'] }, style: { padding: '32px', gap: '24px' } } } },
                                { id: 'header', component: { Row: { children: { explicitList: ['score_label', 'timer'] }, distribution: 'spaceBetween' } } },
                                { id: 'score_label', component: { Text: { text: { literalString: 'Score: 0/10' } } } },
                                { id: 'timer', component: { Text: { text: { literalString: '⏱️ 30s' } } } },
                                { id: 'question', component: { Heading: { text: { literalString: 'What is the capital of France?' }, usageHint: 'h2' } } },
                                { id: 'options', component: { Column: { children: { explicitList: ['opt_a', 'opt_b', 'opt_c', 'opt_d'] }, style: { gap: '12px' } } } },
                                { id: 'opt_a', component: { Button: { label: { literalString: 'A) London' } } } },
                                { id: 'opt_b', component: { Button: { label: { literalString: 'B) Paris' } } } },
                                { id: 'opt_c', component: { Button: { label: { literalString: 'C) Berlin' } } } },
                                { id: 'opt_d', component: { Button: { label: { literalString: 'D) Madrid' } } } },
                                { id: 'submit', component: { Button: { label: { literalString: 'Next Question →' } } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            },
            {
                id: 'true-false-quiz',
                name: 'True or False',
                category: 'form',
                description: 'Simple true/false trivia format',
                icon: 'check_circle',
                gradientColors: ['#11998e', '#38ef7d'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Column: { children: { explicitList: ['category_badge', 'statement', 'buttons', 'progress'] }, style: { padding: '40px', textAlign: 'center', gap: '32px' } } } },
                                { id: 'category_badge', component: { Text: { text: { literalString: '🌍 Geography' } } } },
                                { id: 'statement', component: { Heading: { text: { literalString: 'The Great Wall of China is visible from space.' }, usageHint: 'h2' } } },
                                { id: 'buttons', component: { Row: { children: { explicitList: ['true_btn', 'false_btn'] }, distribution: 'center', style: { gap: '24px' } } } },
                                { id: 'true_btn', component: { Button: { label: { literalString: '✓ True' } } } },
                                { id: 'false_btn', component: { Button: { label: { literalString: '✗ False' } } } },
                                { id: 'progress', component: { Text: { text: { literalString: 'Question 3 of 10' } } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            },
            {
                id: 'quiz-results',
                name: 'Quiz Results',
                category: 'dashboard',
                description: 'End-of-quiz score summary',
                icon: 'emoji_events',
                gradientColors: ['#f093fb', '#f5576c'] as [string, string],
                a2uiMessages: [
                    {
                        surfaceUpdate: {
                            components: [
                                { id: 'root', component: { Column: { children: { explicitList: ['trophy', 'congrats', 'score_card', 'stats', 'actions'] }, style: { padding: '40px', textAlign: 'center', gap: '24px' } } } },
                                { id: 'trophy', component: { Heading: { text: { literalString: '🏆' }, usageHint: 'h1' } } },
                                { id: 'congrats', component: { Heading: { text: { literalString: 'Congratulations!' }, usageHint: 'h1' } } },
                                { id: 'score_card', component: { Card: { child: 'score_content' } } },
                                { id: 'score_content', component: { Column: { children: { explicitList: ['score_label', 'score_value'] }, style: { padding: '24px' } } } },
                                { id: 'score_label', component: { Text: { text: { literalString: 'Your Score' } } } },
                                { id: 'score_value', component: { Heading: { text: { literalString: '8/10' }, usageHint: 'h1' } } },
                                { id: 'stats', component: { Row: { children: { explicitList: ['stat_correct', 'stat_time'] }, distribution: 'center', style: { gap: '40px' } } } },
                                { id: 'stat_correct', component: { Text: { text: { literalString: '✓ 80% Correct' } } } },
                                { id: 'stat_time', component: { Text: { text: { literalString: '⏱️ 2:34' } } } },
                                { id: 'actions', component: { Row: { children: { explicitList: ['retry_btn', 'share_btn'] }, distribution: 'center', style: { gap: '16px' } } } },
                                { id: 'retry_btn', component: { Button: { label: { literalString: 'Play Again' } } } },
                                { id: 'share_btn', component: { Button: { label: { literalString: 'Share Results' } } } }
                            ]
                        }
                    },
                    { beginRendering: { root: 'root' } }
                ]
            }
        ]
    }
];

// ============================================================================
// Agent Registry Class
// ============================================================================

const STORAGE_KEY = 'a2ui_custom_agents';

export class AgentRegistry {
    private agents: Map<string, Agent> = new Map();
    private activeAgentId: string | null = null;

    constructor() {
        // Load built-in agents
        for (const agent of BUILTIN_AGENTS) {
            this.agents.set(agent.id, agent);
        }

        // Load custom agents from localStorage
        this.loadCustomAgents();

        // Set default active agent
        this.activeAgentId = 'web-designer';
    }

    /**
     * Get all agents (built-in + custom)
     */
    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): Agent[] {
        return this.getAllAgents().filter(a => a.type === type);
    }

    /**
     * Get agents by category
     */
    getAgentsByCategory(category: string): Agent[] {
        return this.getAllAgents().filter(a => a.category === category);
    }

    /**
     * Get built-in agents only
     */
    getBuiltinAgents(): Agent[] {
        return this.getAgentsByType('builtin');
    }

    /**
     * Get custom agents only
     */
    getCustomAgents(): Agent[] {
        return this.getAgentsByType('custom');
    }

    /**
     * Get agent by ID
     */
    getAgentById(id: string): Agent | undefined {
        return this.agents.get(id);
    }

    /**
     * Get active agent
     */
    getActiveAgent(): Agent | undefined {
        return this.activeAgentId ? this.agents.get(this.activeAgentId) : undefined;
    }

    /**
     * Set active agent
     */
    setActiveAgent(id: string): boolean {
        if (this.agents.has(id)) {
            this.activeAgentId = id;
            return true;
        }
        return false;
    }

    /**
     * Add a custom agent
     */
    addAgent(agent: Omit<Agent, 'id' | 'createdAt'>): Agent {
        const id = `custom-${Date.now()}`;
        const newAgent: Agent = {
            ...agent,
            id,
            type: 'custom',
            createdAt: Date.now()
        };

        this.agents.set(id, newAgent);
        this.saveCustomAgents();

        return newAgent;
    }

    /**
     * Update a custom agent
     */
    updateAgent(id: string, updates: Partial<Agent>): boolean {
        const agent = this.agents.get(id);
        if (!agent || agent.type !== 'custom') {
            return false;
        }

        const updatedAgent = { ...agent, ...updates, id }; // Preserve ID
        this.agents.set(id, updatedAgent);
        this.saveCustomAgents();

        return true;
    }

    /**
     * Delete a custom agent
     */
    deleteAgent(id: string): boolean {
        const agent = this.agents.get(id);
        if (!agent || agent.type !== 'custom') {
            return false;
        }

        this.agents.delete(id);
        this.saveCustomAgents();

        // If deleted agent was active, switch to default
        if (this.activeAgentId === id) {
            this.activeAgentId = 'web-designer';
        }

        return true;
    }

    /**
     * Export agent config as JSON
     */
    exportAgent(id: string): string | null {
        const agent = this.agents.get(id);
        if (!agent) return null;

        // Don't export built-in agents' full prompts
        const exportable = { ...agent };
        return JSON.stringify(exportable, null, 2);
    }

    /**
     * Import agent from JSON
     */
    importAgent(json: string): Agent | null {
        try {
            const data = JSON.parse(json);
            if (!data.name || !data.config) {
                throw new Error('Invalid agent format');
            }

            return this.addAgent({
                name: data.name,
                description: data.description || '',
                icon: data.icon || 'smart_toy',
                type: 'custom',
                category: data.category,
                config: data.config
            });
        } catch (e) {
            console.error('Failed to import agent:', e);
            return null;
        }
    }

    /**
     * Load custom agents from localStorage
     */
    private loadCustomAgents(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const customAgents: Agent[] = JSON.parse(stored);
                for (const agent of customAgents) {
                    this.agents.set(agent.id, agent);
                }
            }
        } catch (e) {
            console.error('Failed to load custom agents:', e);
        }
    }

    /**
     * Save custom agents to localStorage
     */
    private saveCustomAgents(): void {
        try {
            const customAgents = this.getCustomAgents();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customAgents));
        } catch (e) {
            console.error('Failed to save custom agents:', e);
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let registryInstance: AgentRegistry | null = null;

export function getAgentRegistry(): AgentRegistry {
    if (!registryInstance) {
        registryInstance = new AgentRegistry();
    }
    return registryInstance;
}

/**
 * Get all unique categories from agents
 */
export function getAgentCategories(): string[] {
    const registry = getAgentRegistry();
    const categories = new Set<string>();

    for (const agent of registry.getAllAgents()) {
        if (agent.category) {
            categories.add(agent.category);
        }
    }

    return Array.from(categories);
}
