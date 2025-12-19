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
	import { resolveNumber, generateId } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.SliderNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		value: Primitives.NumberValue | null;
		minValue: Primitives.NumberValue | null;
		maxValue: Primitives.NumberValue | null;
		label?: string;
	}

	let {
		surfaceId,
		component,
		weight,
		processor,
		theme,
		value,
		minValue,
		maxValue,
		label = ''
	}: Props = $props();

	const inputId = generateId('a2ui-slider');

	let currentValue = $derived(resolveNumber(processor, component, surfaceId, value) ?? 0);
	let min = $derived(resolveNumber(processor, component, surfaceId, minValue) ?? 0);
	let max = $derived(resolveNumber(processor, component, surfaceId, maxValue) ?? 100);

	let containerClasses = $derived(classMap(theme.components.Slider?.container));
	let inputClasses = $derived(classMap(theme.components.Slider?.element));
	let labelClasses = $derived(classMap(theme.components.Slider?.label));
	let containerStyles = $derived(styleMap(theme.additionalStyles?.Slider));

	function handleInput(event: Event) {
		const path = value?.path;

		if (!(event.target instanceof HTMLInputElement) || !path) {
			return;
		}

		processor.setData(component, path, parseFloat(event.target.value), surfaceId);
	}
</script>

<div class="a2ui-slider-host" style="--weight: {weight}">
	<section class={containerClasses} style={containerStyles}>
		{#if label}
			<label for={inputId} class={labelClasses}>
				{label}
			</label>
		{/if}

		<div class="slider-row">
			<input
				type="range"
				id={inputId}
				class={inputClasses}
				value={currentValue}
				min={min}
				max={max}
				oninput={handleInput}
			/>
			<span class="value-display">{currentValue}</span>
		</div>
	</section>
</div>

<style>
	.a2ui-slider-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	input[type='range'] {
		flex: 1;
	}

	.value-display {
		min-width: 40px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
