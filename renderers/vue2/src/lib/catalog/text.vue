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

<template>
  <section
    class="a2ui-text"
    :class="classes"
    :style="[weightStyle, additionalStyles]"
    v-html="resolvedText"
  ></section>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import { Styles } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';
import { markdownRenderer } from '../data/markdown';

interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

export default DynamicComponentVue.extend({
  name: 'A2UIText',

  mixins: [DynamicComponentMixin],

  props: {
    text: {
      type: Object as PropType<Primitives.StringValue | null>,
      required: true,
    },
    usageHint: {
      type: String as PropType<Types.ResolvedText['usageHint'] | null>,
      default: null,
    },
  },

  computed: {
    resolvedText(): string {
      const usageHint = this.usageHint;
      let value = this.resolvePrimitive(this.text) as string | null;

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
        Styles.appendToAll(this.theme.markdown, ['ol', 'ul', 'li'], {})
      );
    },

    classes(): Record<string, boolean> {
      const usageHint = this.usageHint;

      return Styles.merge(
        this.theme.components.Text.all,
        usageHint ? this.theme.components.Text[usageHint as keyof typeof this.theme.components.Text] : {}
      );
    },

    additionalStyles(): Record<string, string> | null {
      const usageHint = this.usageHint;
      const styles = this.theme.additionalStyles?.Text;

      if (!styles) {
        return null;
      }

      // Check if styles are hinted (have h1, h2, etc. keys)
      if (this.areHintedStyles(styles)) {
        return styles[usageHint ?? 'body'];
      }

      return styles as Record<string, string>;
    },
  },

  methods: {
    areHintedStyles(styles: unknown): styles is HintedStyles {
      if (typeof styles !== 'object' || !styles || Array.isArray(styles)) {
        return false;
      }

      const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'caption', 'body'];
      return expected.every((v) => v in styles);
    },
  },
});
</script>

<style>
.a2ui-text {
  display: block;
  flex: var(--weight);
}

.a2ui-text h1,
.a2ui-text h2,
.a2ui-text h3,
.a2ui-text h4,
.a2ui-text h5 {
  line-height: inherit;
  font: inherit;
}
</style>
