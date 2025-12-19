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

import type { Types } from '@a2ui/lit/0.8';
import type { Catalog } from '../rendering/catalog.js';

// Import frequently used components directly
import Row from './Row.svelte';
import Column from './Column.svelte';
import Text from './Text.svelte';

/**
 * Default catalog containing all 18 standard A2UI components.
 * Frequently used components are loaded eagerly, others are lazy-loaded.
 */
export const DEFAULT_CATALOG: Catalog = {
	// Layout components (eagerly loaded - frequently used)
	Row: {
		component: () => Row,
		props: (node) => {
			const properties = (node as Types.RowNode).properties;
			return {
				alignment: properties.alignment ?? 'stretch',
				distribution: properties.distribution ?? 'start'
			};
		}
	},

	Column: {
		component: () => Column,
		props: (node) => {
			const properties = (node as Types.ColumnNode).properties;
			return {
				alignment: properties.alignment ?? 'stretch',
				distribution: properties.distribution ?? 'start'
			};
		}
	},

	// Content components
	Text: {
		component: () => Text,
		props: (node) => {
			const properties = (node as Types.TextNode).properties;
			return {
				text: properties.text,
				usageHint: properties.usageHint ?? null
			};
		}
	},

	// Lazy-loaded components
	List: {
		component: () => import('./List.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.ListNode).properties;
			return {
				direction: properties.direction ?? 'vertical'
			};
		}
	},

	Card: {
		component: () => import('./Card.svelte').then((m) => m.default)
	},

	Image: {
		component: () => import('./Image.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.ImageNode).properties;
			return {
				url: properties.url,
				usageHint: properties.usageHint ?? null
			};
		}
	},

	Icon: {
		component: () => import('./Icon.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.IconNode).properties;
			return {
				name: properties.name
			};
		}
	},

	Video: {
		component: () => import('./Video.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.VideoNode).properties;
			return {
				url: properties.url
			};
		}
	},

	AudioPlayer: {
		component: () => import('./AudioPlayer.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.AudioPlayerNode).properties;
			return {
				url: properties.url
			};
		}
	},

	Button: {
		component: () => import('./Button.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.ButtonNode).properties;
			return {
				action: properties.action ?? null
			};
		}
	},

	Divider: {
		component: () => import('./Divider.svelte').then((m) => m.default)
	},

	MultipleChoice: {
		component: () => import('./MultipleChoice.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.MultipleChoiceNode).properties;
			return {
				options: properties.options ?? [],
				value: properties.selections ?? null,
				description: 'Select an item'
			};
		}
	},

	TextField: {
		component: () => import('./TextField.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.TextFieldNode).properties;
			return {
				text: properties.text ?? null,
				label: properties.label ?? null,
				inputType: properties.type ?? null
			};
		}
	},

	DateTimeInput: {
		component: () => import('./DateTimeInput.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.DateTimeInputNode).properties;
			return {
				enableDate: properties.enableDate ?? true,
				enableTime: properties.enableTime ?? false,
				value: properties.value ?? null
			};
		}
	},

	CheckBox: {
		component: () => import('./CheckBox.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.CheckboxNode).properties;
			return {
				label: properties.label ?? null,
				value: properties.value ?? null
			};
		}
	},

	Slider: {
		component: () => import('./Slider.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.SliderNode).properties;
			return {
				value: properties.value ?? null,
				minValue: properties.minValue ?? null,
				maxValue: properties.maxValue ?? null,
				label: ''
			};
		}
	},

	Tabs: {
		component: () => import('./Tabs.svelte').then((m) => m.default),
		props: (node) => {
			const properties = (node as Types.TabsNode).properties;
			return {
				tabs: properties.tabItems ?? []
			};
		}
	},

	Modal: {
		component: () => import('./Modal.svelte').then((m) => m.default)
	}
};
