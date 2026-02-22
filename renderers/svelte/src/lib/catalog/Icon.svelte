<!--
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
-->

<script lang="ts">
	import type { Types, Primitives } from '@a2ui/lit/0.8';
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import { resolveString } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.IconNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		name: Primitives.StringValue | null;
	}

	let { surfaceId, component, weight, processor, theme, name }: Props = $props();

	// Convert camelCase to snake_case for Material Symbols compatibility
	// e.g., "calendarToday" -> "calendar_today"
	function toSnakeCase(str: string): string {
		return str.replace(/([A-Z])/g, '_$1').toLowerCase();
	}

	let iconName = $derived.by(() => {
		const resolved = resolveString(processor, component, surfaceId, name);
		return resolved ? toSnakeCase(resolved) : '';
	});
	let iconClasses = $derived(classMap(theme.components.Icon));
	let iconStyles = $derived(styleMap(theme.additionalStyles?.Icon));
</script>

<section class="a2ui-icon-host {iconClasses}" style="--weight: {weight}; {iconStyles}">
	<span class="g-icon">{iconName}</span>
</section>

<style>
	.a2ui-icon-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}
</style>
