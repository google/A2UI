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
	import { getCatalog, getProcessor, getTheme } from './context.svelte.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.AnyComponentNode | null;
	}

	let { surfaceId, component }: Props = $props();

	const catalog = getCatalog();
	const processor = getProcessor();
	const theme = getTheme();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let LoadedComponent = $state<any>(null);
	let componentProps = $state<Record<string, unknown>>({});
	let loadError = $state<string | null>(null);

	$effect(() => {
		if (!component) {
			LoadedComponent = null;
			componentProps = {};
			loadError = null;
			return;
		}

		const entry = catalog[component.type];
		if (!entry) {
			console.warn(`Unknown component type: ${component.type}`);
			loadError = `Unknown component type: ${component.type}`;
			LoadedComponent = null;
			return;
		}

		loadError = null;

		// Load component
		const loadResult = entry.component();
		if (loadResult instanceof Promise) {
			loadResult
				.then((mod) => {
					// The promise already resolves to the component (m.default from catalog)
					LoadedComponent = mod;
				})
				.catch((err) => {
					console.error(`Failed to load component ${component.type}:`, err);
					loadError = `Failed to load component: ${component.type}`;
				});
		} else {
			LoadedComponent = loadResult;
		}

		// Resolve additional props from catalog entry
		componentProps = entry.props ? entry.props(component) : {};
	});
</script>

{#if loadError}
	<div class="a2ui-error">
		{loadError}
	</div>
{:else if LoadedComponent && component}
	<LoadedComponent
		{surfaceId}
		{component}
		weight={component.weight ?? 'initial'}
		{processor}
		{theme}
		{...componentProps}
	/>
{/if}

<style>
	.a2ui-error {
		padding: 8px 12px;
		background-color: #fee;
		border: 1px solid #f00;
		border-radius: 4px;
		color: #a00;
		font-size: 12px;
	}
</style>
