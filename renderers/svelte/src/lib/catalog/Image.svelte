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
	import { resolveString } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.ImageNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		url: Primitives.StringValue | null;
		usageHint?: Types.ResolvedImage['usageHint'] | null;
		fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | null;
	}

	let { surfaceId, component, weight, processor, theme, url, usageHint, fit }: Props = $props();

	let resolvedUrl = $derived(resolveString(processor, component, surfaceId, url) ?? '');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let imageClasses = $derived.by(() => {
		const allClasses = (theme.components.Image as any)?.all ?? {};
		const hintClasses = usageHint ? (theme.components.Image as any)?.[usageHint] ?? {} : {};
		return classMap({ ...allClasses, ...hintClasses });
	});
	let imageStyles = $derived(styleMap(theme.additionalStyles?.Image));
</script>

<div class="a2ui-image-host" style="--weight: {weight}; --object-fit: {fit ?? 'fill'}" data-usage-hint={usageHint}>
	<section class={imageClasses} style={imageStyles}>
		<img src={resolvedUrl} alt="" />
	</section>
</div>

<style>
	.a2ui-image-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: var(--object-fit, fill);
	}
</style>
