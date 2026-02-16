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

<script setup lang="ts">
import { computed } from 'vue';
import DOMPurify from 'dompurify';
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Styles from '@a2ui/web_core/styles/index';
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import { useMarkdownRenderer } from '../data/markdown';

interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.TextNode;
  weight: string | number;
  text: Primitives.StringValue | null;
  usageHint: Types.ResolvedText['usageHint'] | null;
}>();

const { theme, resolvePrimitive } = useDynamicComponent(props);
const markdownRenderer = useMarkdownRenderer();

const resolvedText = computed(() => {
  const usageHint = props.usageHint;
  let value = resolvePrimitive(props.text);

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

  return DOMPurify.sanitize(markdownRenderer.render(
      value,
      Styles.appendToAll(theme.markdown, ['ol', 'ul', 'li'], {}),
  ));
});

const classes = computed(() => {
  const usageHint = props.usageHint;

  return Styles.merge(
    theme.components.Text.all,
    usageHint ? theme.components.Text[usageHint] : {},
  );
});

const additionalStyles = computed(() => {
  const usageHint = props.usageHint;
  const styles = theme.additionalStyles?.Text;

  if (!styles) {
    return null;
  }

  let additionalStyles: Record<string, string> = {};

  if (areHintedStyles(styles)) {
    additionalStyles = styles[usageHint ?? 'body'];
  } else {
    additionalStyles = styles as Record<string, string>;
  }

  return additionalStyles;
});

function areHintedStyles(styles: unknown): styles is HintedStyles {
  if (typeof styles !== 'object' || !styles || Array.isArray(styles)) {
    return false;
  }

  const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'caption', 'body'];
  return expected.every((v) => v in styles);
}
</script>

<template>
  <a2ui-text>
    <section
      :class="classes"
      :style="additionalStyles"
      v-html="resolvedText"
    >
    </section>
  </a2ui-text>
</template>

<style>
a2ui-text{
  display: block;
  flex: v-bind(props.weight);
}
a2ui-text h1,
a2ui-text h2,
a2ui-text h3,
a2ui-text h4,
a2ui-text h5 {
  line-height: inherit;
  font: inherit;
}
</style>
