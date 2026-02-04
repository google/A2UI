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
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import { resolveString } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';
	import Renderer from '../rendering/Renderer.svelte';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.TabsNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		tabs: Types.ResolvedTabs['tabItems'];
	}

	let { surfaceId, component, weight, processor, theme, tabs = [] }: Props = $props();

	let selectedIndex = $state(0);

	let tabTitles = $derived.by(() => {
		return tabs.map((tab) => resolveString(processor, component, surfaceId, tab.title) ?? '');
	});

	let selectedTab = $derived(tabs[selectedIndex]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tabsTheme = theme.components.Tabs as any;
	let containerClasses = $derived(classMap(tabsTheme?.container));
	let contentClasses = $derived(classMap(tabsTheme?.element));
	let containerStyles = $derived(styleMap(theme.additionalStyles?.Tabs));

	function getButtonClasses(index: number): string {
		if (index === selectedIndex) {
			return classMap(
				Styles.merge(tabsTheme?.controls?.all ?? {}, tabsTheme?.controls?.selected ?? {})
			);
		}
		return classMap({ ...(tabsTheme?.controls?.all ?? {}) });
	}

	function selectTab(index: number) {
		selectedIndex = index;
	}
</script>

<div class="a2ui-tabs-host" style="--weight: {weight}">
	<section class={containerClasses} style={containerStyles}>
		<div id="buttons" class={contentClasses}>
			{#each tabTitles as title, index}
				<button
					disabled={index === selectedIndex}
					class={getButtonClasses(index)}
					onclick={() => selectTab(index)}
				>
					{title}
				</button>
			{/each}
		</div>

		{#if selectedTab}
			<Renderer {surfaceId} component={selectedTab.child} />
		{/if}
	</section>
</div>

<style>
	.a2ui-tabs-host {
		display: block;
		flex: var(--weight);
	}
</style>
