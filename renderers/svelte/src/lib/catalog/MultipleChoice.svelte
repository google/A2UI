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
		component: Types.MultipleChoiceNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		options: Primitives.StringValue[];
		value: Primitives.StringValue | null;
		description?: string;
	}

	let {
		surfaceId,
		component,
		weight,
		processor,
		theme,
		options = [],
		value,
		description = 'Select an item'
	}: Props = $props();

	const selectId = generateId('a2ui-select');

	let currentValue = $derived(resolveString(processor, component, surfaceId, value) ?? '');

	let resolvedOptions = $derived.by(() => {
		return options.map((opt) => resolveString(processor, component, surfaceId, opt) ?? '');
	});

	let containerClasses = $derived(classMap(theme.components.MultipleChoice?.container));
	let selectClasses = $derived(classMap(theme.components.MultipleChoice?.element));
	let containerStyles = $derived(styleMap(theme.additionalStyles?.MultipleChoice));

	function handleChange(event: Event) {
		const path = value?.path;

		if (!(event.target instanceof HTMLSelectElement) || !path) {
			return;
		}

		processor.setData(component, path, event.target.value, surfaceId);
	}
</script>

<div class="a2ui-multiple-choice-host" style="--weight: {weight}">
	<section class={containerClasses} style={containerStyles}>
		<select id={selectId} class={selectClasses} value={currentValue} onchange={handleChange}>
			<option value="" disabled>{description}</option>
			{#each resolvedOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</section>
</div>

<style>
	.a2ui-multiple-choice-host {
		display: flex;
		flex: var(--weight);
	}

	section {
		display: flex;
		width: 100%;
	}

	select {
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
</style>
