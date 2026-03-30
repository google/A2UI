<script lang="ts">import ComponentHost from '../core/ComponentHost.svelte';
let { props, surface, dataContextPath, registry } = $props();
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
