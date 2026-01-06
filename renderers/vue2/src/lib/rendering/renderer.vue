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
  <component
    v-if="resolvedComponent"
    :is="resolvedComponent"
    :surface-id="surfaceId"
    :component="component"
    :weight="component.weight !== undefined ? component.weight : 'initial'"
    v-bind="additionalProps"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import type { Component as VueComponent, PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import { Styles } from '@a2ui/lit/0.8';
import { CATALOG_KEY, type Catalog, type CatalogEntry } from './catalog';

// Track whether structural styles have been injected
let hasInsertedStyles = false;

export default Vue.extend({
  name: 'A2UIRenderer',

  inject: {
    catalog: { from: CATALOG_KEY },
  },

  props: {
    surfaceId: {
      type: String as PropType<Types.SurfaceID>,
      required: true,
    },
    component: {
      type: Object as PropType<Types.AnyComponentNode>,
      required: true,
    },
  },

  data() {
    return {
      resolvedComponent: null as VueComponent | null,
      additionalProps: {} as Record<string, unknown>,
    };
  },

  watch: {
    component: {
      immediate: true,
      handler() {
        this.resolveComponent();
      },
    },
  },

  mounted() {
    // Inject structural styles once on first mount
    if (!hasInsertedStyles && typeof document !== 'undefined') {
      const styles = document.createElement('style');
      styles.textContent = Styles.structuralStyles;
      document.head.appendChild(styles);
      hasInsertedStyles = true;
    }
  },

  methods: {
    async resolveComponent() {
      const catalog = (this as any).catalog as Catalog;

      if (!catalog) {
        console.error('Catalog not provided. Make sure to use the A2UI plugin.');
        return;
      }

      const config = catalog[this.component.type];

      if (!config) {
        console.warn(`No component registered for type: ${this.component.type}`);
        this.resolvedComponent = null;
        this.additionalProps = {};
        return;
      }

      try {
        if (typeof config === 'function') {
          // Simple loader
          const result = await config();
          this.resolvedComponent = this.extractComponent(result);
          this.additionalProps = {};
        } else if (typeof config === 'object' && config.type) {
          // Loader with props mapping
          const result = await config.type();
          this.resolvedComponent = this.extractComponent(result);
          this.additionalProps = config.props(this.component);
        }
      } catch (error) {
        console.error(`Failed to load component for type: ${this.component.type}`, error);
        this.resolvedComponent = null;
        this.additionalProps = {};
      }
    },

    extractComponent(result: any): VueComponent {
      // Handle ES module default exports
      if (result && result.default) {
        return result.default;
      }
      return result;
    },
  },
});
</script>
