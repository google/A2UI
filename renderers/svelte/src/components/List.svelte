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

  const direction = $derived(props.direction?.value ?? 'vertical');
  const align = $derived(props.align?.value ?? 'stretch');

  const children = $derived.by(() => {
    const raw = props.children?.value;
    return Array.isArray(raw) ? raw : [];
  });

  const isRepeating = $derived(!!props.children?.raw?.componentId);
  const templateId = $derived(props.children?.raw?.componentId);

  const flexDirection = $derived(direction === 'horizontal' ? 'row' : 'column');

  function getNormalizedPath(path: string, dcp: string, index: number): string {
    let normalized = path || '';
    if (!normalized.startsWith('/')) {
      const base = dcp === '/' ? '' : dcp;
      normalized = `${base}/${normalized}`;
    }
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return `${normalized}/${index}`;
  }
</script>

<div
  class="a2ui-list {direction}"
  style:display="flex"
  style:flex-direction={flexDirection}
  style:gap="8px"
  style:align-items={align}
>
  {#if !isRepeating}
    {#each children as childId (childId)}
      <div class="a2ui-list-item">
        <ComponentHost
          {surface}
          componentId={childId}
          {dataContextPath}
          {registry}
        />
      </div>
    {/each}
  {:else}
    {#each children as _, i (i)}
      <div class="a2ui-list-item">
        <ComponentHost
          {surface}
          componentId={templateId}
          dataContextPath={getNormalizedPath(props.children?.raw?.path, dataContextPath, i)}
          {registry}
        />
      </div>
    {/each}
  {/if}
</div>
