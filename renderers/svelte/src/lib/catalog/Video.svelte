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
		component: Types.VideoNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		url: Primitives.StringValue | null;
	}

	let { surfaceId, component, weight, processor, theme, url }: Props = $props();

	let videoUrl = $derived(resolveString(processor, component, surfaceId, url) ?? '');
	let videoClasses = $derived(classMap(theme.components.Video));
	let videoStyles = $derived(styleMap(theme.additionalStyles?.Video));
</script>

<div class="a2ui-video-host" style="--weight: {weight}">
	<section class={videoClasses} style={videoStyles}>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video src={videoUrl} controls>
			<track kind="captions" />
		</video>
	</section>
</div>

<style>
	.a2ui-video-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	video {
		display: block;
		width: 100%;
	}
</style>
