<script lang="ts">let { props } = $props();
const axis = $derived(props.axis?.value ?? 'horizontal');
export {};
</script>

{#if axis === 'vertical'}
  <div
    class="a2ui-divider vertical"
    style:border-left="1px solid #ccc"
    style:align-self="stretch"
    style:min-height="1em"
  ></div>
{:else}
  <hr
    class="a2ui-divider horizontal"
    style:border="none"
    style:border-top="1px solid #ccc"
    style:width="100%"
    style:margin="0"
  />
{/if}
