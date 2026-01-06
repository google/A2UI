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
  <span
    class="a2ui-icon g-icon"
    :class="theme.components.Icon"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.Icon]"
  >{{ resolvedName }}</span>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';

// Map A2UI icon names to Material Symbols names
const ICON_MAP: Record<string, string> = {
  accountCircle: 'account_circle',
  add: 'add',
  arrowBack: 'arrow_back',
  arrowForward: 'arrow_forward',
  attachFile: 'attach_file',
  calendarToday: 'calendar_today',
  call: 'call',
  camera: 'camera',
  check: 'check',
  close: 'close',
  delete: 'delete',
  download: 'download',
  edit: 'edit',
  event: 'event',
  error: 'error',
  favorite: 'favorite',
  favoriteOff: 'favorite_border',
  folder: 'folder',
  help: 'help',
  home: 'home',
  info: 'info',
  locationOn: 'location_on',
  lock: 'lock',
  lockOpen: 'lock_open',
  mail: 'mail',
  menu: 'menu',
  moreVert: 'more_vert',
  moreHoriz: 'more_horiz',
  notificationsOff: 'notifications_off',
  notifications: 'notifications',
  payment: 'payment',
  person: 'person',
  phone: 'phone',
  photo: 'photo',
  print: 'print',
  refresh: 'refresh',
  search: 'search',
  send: 'send',
  settings: 'settings',
  share: 'share',
  shoppingCart: 'shopping_cart',
  star: 'star',
  starHalf: 'star_half',
  starOff: 'star_border',
  upload: 'upload',
  visibility: 'visibility',
  visibilityOff: 'visibility_off',
  warning: 'warning',
};

export default Vue.extend({
  name: 'A2UIIcon',

  mixins: [DynamicComponentMixin],

  props: {
    name: {
      type: Object as PropType<Primitives.StringValue | null>,
      required: true,
    },
  },

  computed: {
    resolvedName(): string {
      const name = (this as any).resolvePrimitive(this.name);
      if (!name) return '';
      return ICON_MAP[name] || name;
    },
  },
});
</script>

<style>
.a2ui-icon {
  display: inline-block;
  flex: var(--weight);
}
</style>
