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

	let iconName = $derived(resolveString(processor, component, surfaceId, name) ?? '');
	let iconClasses = $derived(classMap(theme.components.Icon));
	let iconStyles = $derived(styleMap(theme.additionalStyles?.Icon));
</script>

<span class="g-icon {iconClasses}" style="--weight: {weight}; {iconStyles}">
	{iconName}
</span>

<style>
	.g-icon {
		font-family: 'Material Symbols Outlined', sans-serif;
		font-weight: normal;
		font-style: normal;
		font-size: 24px;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		display: inline-block;
		white-space: nowrap;
		word-wrap: normal;
		direction: ltr;
		-webkit-font-smoothing: antialiased;
		flex: var(--weight);
	}
</style>
