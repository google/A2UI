<script lang="ts">let { props } = $props();
const name = $derived(props.name?.value);
const iconName = $derived(typeof name === 'object' && name?.path ? name.path : (name ?? ''));
const isPath = $derived(typeof name === 'object' && name?.path);
export {};
</script>

{#if isPath}
  <svg class="a2ui-icon custom-path" viewBox="0 0 24 24">
    <path d={iconName} fill="currentColor" />
  </svg>
{:else}
  <span class="a2ui-icon">{iconName}</span>
{/if}
