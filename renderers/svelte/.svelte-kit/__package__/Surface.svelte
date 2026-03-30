<script lang="ts">import ComponentHost from './core/ComponentHost.svelte';
let { surfaceGroup, surfaceId, registry } = $props();
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
