<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry, BoundProperty } from '../core/types.js';
  import ComponentHost from '../core/ComponentHost.svelte';

  interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
  }

  let { props, surface, dataContextPath, registry }: Props = $props();

  const child = $derived(props.child?.value);
</script>

<div class="a2ui-card">
  {#if child}
    <ComponentHost
      {surface}
      componentId={child}
      {dataContextPath}
      {registry}
    />
  {/if}
</div>
