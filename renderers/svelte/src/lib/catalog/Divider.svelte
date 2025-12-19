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
	import type { Types } from '@a2ui/lit/0.8';
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.DividerNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
	}

	let { surfaceId, component, weight, processor, theme }: Props = $props();

	let dividerClasses = $derived(classMap(theme.components.Divider));
	let dividerStyles = $derived(styleMap(theme.additionalStyles?.Divider));
</script>

<hr class={dividerClasses} style="--weight: {weight}; {dividerStyles}" />

<style>
	hr {
		display: block;
		flex: var(--weight);
		border: none;
		border-top: 1px solid currentColor;
		margin: 8px 0;
	}
</style>
