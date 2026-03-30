<script lang="ts">
  import type { SurfaceGroupModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry } from './core/types.js';
  import ComponentHost from './core/ComponentHost.svelte';

  interface Props {
    /** The surface group model containing all surfaces. */
    surfaceGroup: SurfaceGroupModel<ComponentApi>;
    /** The ID of the surface to render. */
    surfaceId: string;
    /** The component registry mapping type names to Svelte components. */
    registry: ComponentRegistry;
  }

  let { surfaceGroup, surfaceId, registry }: Props = $props();

  const surface = $derived(surfaceGroup.getSurface(surfaceId));
</script>

{#if surface}
  <div class="a2ui-surface" data-surface-id={surfaceId}>
    <ComponentHost
      {surface}
      componentId="root"
      dataContextPath="/"
      {registry}
    />
  </div>
{/if}
