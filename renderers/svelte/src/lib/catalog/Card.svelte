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
		component: Types.CardNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
	}

	let { surfaceId, component, weight, processor, theme }: Props = $props();

	let cardClasses = $derived(classMap(theme.components.Card));
	let cardStyles = $derived(styleMap(theme.additionalStyles?.Card));
</script>

<div class="a2ui-card-host" style="--weight: {weight}">
	<section class={cardClasses} style={cardStyles}>
		<Renderer {surfaceId} component={component.properties.child} />
	</section>
</div>

<style>
	.a2ui-card-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	section {
		height: 100%;
		box-sizing: border-box;
	}
</style>
