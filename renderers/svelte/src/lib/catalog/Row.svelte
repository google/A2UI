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
		component: Types.RowNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		alignment?: Types.ResolvedRow['alignment'];
		distribution?: Types.ResolvedRow['distribution'];
	}

	let {
		surfaceId,
		component,
		weight,
		processor,
		theme,
		alignment = 'stretch',
		distribution = 'start'
	}: Props = $props();

	let sectionClasses = $derived.by(() => {
		const classes = {
			...theme.components.Row,
			[`align-${alignment}`]: true,
			[`distribute-${distribution}`]: true
		};
		return classMap(classes);
	});

	let sectionStyles = $derived(styleMap(theme.additionalStyles?.Row));
</script>

<div
	class="a2ui-row-host"
	style="--weight: {weight}"
	data-alignment={alignment}
	data-distribution={distribution}
>
	<section class={sectionClasses} style={sectionStyles}>
		{#each component.properties.children as child (child.id)}
			<Renderer {surfaceId} component={child} />
		{/each}
	</section>
</div>

<style>
	.a2ui-row-host {
		display: flex;
		flex: var(--weight);
	}

	section {
		display: flex;
		flex-direction: row;
		width: 100%;
		min-height: 100%;
		box-sizing: border-box;
	}

	section:global(.align-start) {
		align-items: start;
	}

	section:global(.align-center) {
		align-items: center;
	}

	section:global(.align-end) {
		align-items: end;
	}

	section:global(.align-stretch) {
		align-items: stretch;
	}

	section:global(.distribute-start) {
		justify-content: start;
	}

	section:global(.distribute-center) {
		justify-content: center;
	}

	section:global(.distribute-end) {
		justify-content: end;
	}

	section:global(.distribute-spaceBetween) {
		justify-content: space-between;
	}

	section:global(.distribute-spaceAround) {
		justify-content: space-around;
	}

	section:global(.distribute-spaceEvenly) {
		justify-content: space-evenly;
	}
</style>
