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
		component: Types.AudioPlayerNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		url: Primitives.StringValue | null;
	}

	let { surfaceId, component, weight, processor, theme, url }: Props = $props();

	let audioUrl = $derived(resolveString(processor, component, surfaceId, url) ?? '');
	let audioClasses = $derived(classMap(theme.components.AudioPlayer));
	let audioStyles = $derived(styleMap(theme.additionalStyles?.AudioPlayer));
</script>

<div class="a2ui-audio-host" style="--weight: {weight}">
	<section class={audioClasses} style={audioStyles}>
		<audio src={audioUrl} controls>
			Your browser does not support the audio element.
		</audio>
	</section>
</div>

<style>
	.a2ui-audio-host {
		display: block;
		flex: var(--weight);
		min-height: 0;
		overflow: auto;
	}

	audio {
		display: block;
		width: 100%;
	}
</style>
