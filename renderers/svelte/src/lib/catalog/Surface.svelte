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
	import { Styles } from '@a2ui/lit/0.8';
	import { onMount } from 'svelte';
	import { setA2UIContext } from '../rendering/context.svelte.js';
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import type { Catalog } from '../rendering/catalog.js';
	import Renderer from '../rendering/Renderer.svelte';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		surface: Types.Surface | null;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		catalog: Catalog;
	}

	let { surfaceId, surface, processor, theme, catalog }: Props = $props();

	// Set up context for child components
	setA2UIContext(processor, theme, catalog);

	// Inject structural styles once
	let stylesInjected = false;

	onMount(() => {
		if (!stylesInjected && typeof document !== 'undefined') {
			const existingStyle = document.getElementById('a2ui-structural-styles');
			if (!existingStyle) {
				const styleEl = document.createElement('style');
				styleEl.id = 'a2ui-structural-styles';
				styleEl.textContent = Styles.structuralStyles;
				document.head.appendChild(styleEl);
			}
			stylesInjected = true;
		}
	});

	// Generate color palette styles from primary color
	let surfaceStyles = $derived.by(() => {
		const styles: Record<string, string> = {};

		if (surface?.styles) {
			for (const [key, value] of Object.entries(surface.styles)) {
				switch (key) {
					case 'primaryColor': {
						// Generate palette from primary color
						// Range: 0 = black, 50 = primary, 100 = white
						styles['--p-100'] = '#ffffff';
						styles['--p-99'] = `color-mix(in srgb, ${value} 2%, white 98%)`;
						styles['--p-98'] = `color-mix(in srgb, ${value} 4%, white 96%)`;
						styles['--p-95'] = `color-mix(in srgb, ${value} 10%, white 90%)`;
						styles['--p-90'] = `color-mix(in srgb, ${value} 20%, white 80%)`;
						styles['--p-80'] = `color-mix(in srgb, ${value} 40%, white 60%)`;
						styles['--p-70'] = `color-mix(in srgb, ${value} 60%, white 40%)`;
						styles['--p-60'] = `color-mix(in srgb, ${value} 80%, white 20%)`;
						styles['--p-50'] = value;
						styles['--p-40'] = `color-mix(in srgb, ${value} 80%, black 20%)`;
						styles['--p-35'] = `color-mix(in srgb, ${value} 70%, black 30%)`;
						styles['--p-30'] = `color-mix(in srgb, ${value} 60%, black 40%)`;
						styles['--p-25'] = `color-mix(in srgb, ${value} 50%, black 50%)`;
						styles['--p-20'] = `color-mix(in srgb, ${value} 40%, black 60%)`;
						styles['--p-15'] = `color-mix(in srgb, ${value} 30%, black 70%)`;
						styles['--p-10'] = `color-mix(in srgb, ${value} 20%, black 80%)`;
						styles['--p-5'] = `color-mix(in srgb, ${value} 10%, black 90%)`;
						styles['--p-0'] = '#000000';
						break;
					}

					case 'font': {
						styles['--font-family'] = value;
						styles['--font-family-flex'] = value;
						break;
					}
				}
			}
		}

		return styles;
	});

	let styleString = $derived(
		Object.entries(surfaceStyles)
			.map(([k, v]) => `${k}: ${v}`)
			.join('; ')
	);
</script>

<div class="a2ui-surface" style={styleString}>
	{#if surface?.styles?.logoUrl}
		<div id="surface-logo">
			<img src={surface.styles.logoUrl} alt="" />
		</div>
	{/if}
	{#if surfaceId && surface?.componentTree}
		<Renderer {surfaceId} component={surface.componentTree} />
	{/if}
</div>

<style>
	.a2ui-surface {
		display: flex;
		min-height: 0;
		max-height: 100%;
		flex-direction: column;
		gap: 16px;
	}

	#surface-logo {
		display: flex;
		justify-content: center;
	}

	#surface-logo img {
		width: 50%;
		max-width: 220px;
	}
</style>
