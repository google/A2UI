<script lang="ts">import ComponentHost from '../core/ComponentHost.svelte';
let { props, surface, dataContextPath, registry } = $props();
const justify = $derived(props.justify?.value ?? 'start');
const align = $derived(props.align?.value ?? 'stretch');
const children = $derived.by(() => {
    const raw = props.children?.value;
    return Array.isArray(raw) ? raw : [];
});
const isRepeating = $derived(!!props.children?.raw?.componentId);
const templateId = $derived(props.children?.raw?.componentId);
function getNormalizedPath(path, dcp, index) {
    let normalized = path || '';
    if (!normalized.startsWith('/')) {
        const base = dcp === '/' ? '' : dcp;
        normalized = `${base}/${normalized}`;
    }
    if (normalized.endsWith('/'))
        normalized = normalized.slice(0, -1);
    return `${normalized}/${index}`;
}
</script>

<div
  class="a2ui-row"
  style:display="flex"
  style:flex-direction="row"
  style:width="100%"
  style:gap="4px"
  style:justify-content={justify}
  style:align-items={align}
>
  {#if !isRepeating}
    {#each children as childId (childId)}
      <ComponentHost
        {surface}
        componentId={childId}
        {dataContextPath}
        {registry}
      />
    {/each}
  {:else}
    {#each children as _, i (i)}
      <ComponentHost
        {surface}
        componentId={templateId}
        dataContextPath={getNormalizedPath(props.children?.raw?.path, dataContextPath, i)}
        {registry}
      />
    {/each}
  {/if}
</div>
