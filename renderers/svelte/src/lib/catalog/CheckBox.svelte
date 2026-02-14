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
	import { resolveString, resolveBoolean, generateId } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.CheckboxNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		label: Primitives.StringValue | null;
		value: Primitives.BooleanValue | null;
	}

	let { surfaceId, component, weight, processor, theme, label, value }: Props = $props();

	const inputId = generateId('a2ui-checkbox');

	let inputChecked = $derived(resolveBoolean(processor, component, surfaceId, value) ?? false);
	let resolvedLabel = $derived(resolveString(processor, component, surfaceId, label));

	let containerClasses = $derived(classMap(theme.components.CheckBox?.container));
	let inputClasses = $derived(classMap(theme.components.CheckBox?.element));
	let labelClasses = $derived(classMap(theme.components.CheckBox?.label));
	let containerStyles = $derived(styleMap(theme.additionalStyles?.CheckBox));

	function handleChange(event: Event) {
		const path = value?.path;

		if (!(event.target instanceof HTMLInputElement) || !path) {
			return;
		}

		processor.setData(component, path, event.target.checked, surfaceId);
	}
</script>

<div class="a2ui-checkbox-host" style="--weight: {weight}">
	<section class={containerClasses} style={containerStyles}>
		<input
			autocomplete="off"
			type="checkbox"
			id={inputId}
			checked={inputChecked}
			class={inputClasses}
			onchange={handleChange}
		/>

		<label for={inputId} class={labelClasses}>
			{resolvedLabel}
		</label>
	</section>
</div>

<style>
	.a2ui-checkbox-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	section {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
