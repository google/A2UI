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
	import { Styles } from '@a2ui/lit/0.8';
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import { resolveString } from '../utils/primitives.js';
	import { classMap, styleMap } from '../utils/classes.js';
	import { markdownRenderer } from '../data/markdown.js';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.TextNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
		text: Primitives.StringValue | null;
		usageHint: Types.ResolvedText['usageHint'] | null;
	}

	let { surfaceId, component, weight, processor, theme, text, usageHint }: Props = $props();

	interface HintedStyles {
		h1: Record<string, string>;
		h2: Record<string, string>;
		h3: Record<string, string>;
		h4: Record<string, string>;
		h5: Record<string, string>;
		body: Record<string, string>;
		caption: Record<string, string>;
	}

	function isHintedStyles(styles: unknown): styles is HintedStyles {
		if (typeof styles !== 'object' || !styles || Array.isArray(styles)) {
			return false;
		}
		const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'caption', 'body'];
		return expected.every((v) => v in styles);
	}

	let resolvedText = $derived.by(() => {
		let value = resolveString(processor, component, surfaceId, text);

		if (value == null) {
			return '(empty)';
		}

		switch (usageHint) {
			case 'h1':
				value = `# ${value}`;
				break;
			case 'h2':
				value = `## ${value}`;
				break;
			case 'h3':
				value = `### ${value}`;
				break;
			case 'h4':
				value = `#### ${value}`;
				break;
			case 'h5':
				value = `##### ${value}`;
				break;
			case 'caption':
				value = `*${value}*`;
				break;
			default:
				value = String(value);
				break;
		}

		return markdownRenderer.render(
			value,
			Styles.appendToAll(theme.markdown, ['ol', 'ul', 'li'], {})
		);
	});

	type TextHint = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body';

	let classes = $derived.by(() => {
		const hint = (usageHint ?? 'body') as TextHint;
		const merged = Styles.merge(
			theme.components.Text.all,
			theme.components.Text[hint] ?? {}
		);
		return classMap(merged);
	});

	let additionalStyles = $derived.by(() => {
		const styles = theme.additionalStyles?.Text;
		if (!styles) return '';

		const hint = (usageHint ?? 'body') as TextHint;
		let resolved: Record<string, string>;
		if (isHintedStyles(styles)) {
			resolved = styles[hint];
		} else {
			resolved = styles as Record<string, string>;
		}

		return styleMap(resolved);
	});
</script>

<section class={classes} style="--weight: {weight}; {additionalStyles}">
	{@html resolvedText}
</section>

<style>
	section {
		display: block;
		flex: var(--weight);
	}

	section :global(h1),
	section :global(h2),
	section :global(h3),
	section :global(h4),
	section :global(h5) {
		line-height: inherit;
		font: inherit;
	}
</style>
