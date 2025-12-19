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
	import { sendAction } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';
	import Renderer from '../rendering/Renderer.svelte';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.ButtonNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		action: Types.Action | null;
	}

	let { surfaceId, component, weight, processor, theme, action }: Props = $props();

	function handleClick() {
		if (action) {
			sendAction(processor, component, surfaceId, action);
		}
	}

	let buttonClasses = $derived(classMap(theme.components.Button));
	let buttonStyles = $derived(styleMap(theme.additionalStyles?.Button));
</script>

<div class="a2ui-button-host" style="--weight: {weight}">
	<button class={buttonClasses} style={buttonStyles} onclick={handleClick}>
		<Renderer {surfaceId} component={component.properties.child} />
	</button>
</div>

<style>
	.a2ui-button-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
	}

	button {
		cursor: pointer;
	}
</style>
