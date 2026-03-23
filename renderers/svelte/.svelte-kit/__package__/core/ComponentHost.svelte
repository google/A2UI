<!--
  ComponentHost: dynamic A2UI component renderer.

  Resolves a component by ID from the surface model, binds its props to
  Svelte 5 reactive state, and renders the matching component from the registry.

  Uses {#key} to force full teardown + recreation when componentId or
  dataContextPath changes, ensuring clean signal subscriptions.
-->
<script lang="ts">import ComponentHostInner from './ComponentHostInner.svelte';
let { surface, componentId = 'root', dataContextPath = '/', registry, } = $props();
</script>

{#key `${componentId}:${dataContextPath}`}
  <ComponentHostInner
    {surface}
    {componentId}
    {dataContextPath}
    {registry}
  />
{/key}
