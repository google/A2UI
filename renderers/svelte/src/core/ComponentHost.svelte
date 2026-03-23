<!--
  ComponentHost: dynamic A2UI component renderer.

  Resolves a component by ID from the surface model, binds its props to
  Svelte 5 reactive state, and renders the matching component from the registry.

  Uses {#key} to force full teardown + recreation when componentId or
  dataContextPath changes, ensuring clean signal subscriptions.
-->
<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry } from './types.js';
  import ComponentHostInner from './ComponentHostInner.svelte';

  interface Props {
    surface: SurfaceModel<ComponentApi>;
    componentId?: string;
    dataContextPath?: string;
    registry: ComponentRegistry;
  }

  let {
    surface,
    componentId = 'root',
    dataContextPath = '/',
    registry,
  }: Props = $props();
</script>

{#key `${componentId}:${dataContextPath}`}
  <ComponentHostInner
    {surface}
    {componentId}
    {dataContextPath}
    {registry}
  />
{/key}
