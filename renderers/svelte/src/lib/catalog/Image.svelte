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
	}

	let { surfaceId, component, weight, processor, theme, url, usageHint }: Props = $props();

	let resolvedUrl = $derived(resolveString(processor, component, surfaceId, url) ?? '');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let imageClasses = $derived(classMap((theme.components.Image as any)?.all ?? {}));
	let imageStyles = $derived(styleMap(theme.additionalStyles?.Image));
</script>

<div class="a2ui-image-host" style="--weight: {weight}" data-usage-hint={usageHint}>
	<img src={resolvedUrl} alt="" class={imageClasses} style={imageStyles} />
</div>

<style>
	.a2ui-image-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
	}

	img {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}

	[data-usage-hint='icon'] img {
		width: 24px;
		height: 24px;
	}

	[data-usage-hint='avatar'] img {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}

	[data-usage-hint='feature'] img {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
	}

	[data-usage-hint='header'] img {
		width: 100%;
		max-height: 300px;
		object-fit: cover;
	}
</style>
