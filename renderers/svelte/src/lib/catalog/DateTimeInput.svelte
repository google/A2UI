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
	import { resolveString, generateId } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.DateTimeInputNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		enableDate?: boolean;
		enableTime?: boolean;
		value: Primitives.StringValue | null;
	}

	let {
		surfaceId,
		component,
		weight,
		processor,
		theme,
		enableDate = true,
		enableTime = false,
		value
	}: Props = $props();

	const inputId = generateId('a2ui-datetime');

	let currentValue = $derived(resolveString(processor, component, surfaceId, value) ?? '');

	let inputType = $derived.by(() => {
		if (enableDate && enableTime) return 'datetime-local';
		if (enableTime) return 'time';
		return 'date';
	});

	let containerClasses = $derived(classMap(theme.components.DateTimeInput?.container));
	let inputClasses = $derived(classMap(theme.components.DateTimeInput?.element));
	let containerStyles = $derived(styleMap(theme.additionalStyles?.DateTimeInput));

	function handleInput(event: Event) {
		const path = value?.path;

		if (!(event.target instanceof HTMLInputElement) || !path) {
			return;
		}

		processor.setData(component, path, event.target.value, surfaceId);
	}
</script>

<div class="a2ui-datetime-host" style="--weight: {weight}">
	<section class={containerClasses} style={containerStyles}>
		<input
			type={inputType}
			id={inputId}
			class={inputClasses}
			value={currentValue}
			oninput={handleInput}
		/>
	</section>
</div>

<style>
	.a2ui-datetime-host {
		display: flex;
		flex: var(--weight);
	}

	section {
		display: flex;
		width: 100%;
	}

	input {
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
</style>
