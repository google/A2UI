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
	import Renderer from '../rendering/Renderer.svelte';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.ListNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		direction?: Types.ResolvedList['direction'];
	}

	let { surfaceId, component, weight, processor, theme, direction = 'vertical' }: Props = $props();

	let listClasses = $derived(classMap(theme.components.List));
	let listStyles = $derived(styleMap(theme.additionalStyles?.List));
</script>

<div class="a2ui-list-host" class:horizontal={direction === 'horizontal'} style="--weight: {weight}">
	<section class={listClasses} style={listStyles}>
		{#each component.properties.children as child (child.id)}
			<Renderer {surfaceId} component={child} />
		{/each}
	</section>
</div>

<style>
	.a2ui-list-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	section {
		display: grid;
		gap: 16px;
	}

	.horizontal section {
		display: flex;
		flex-direction: row;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
	}

	.horizontal section > :global(*) {
		flex-shrink: 0;
		max-width: 80%;
		scroll-snap-align: start;
	}
</style>
