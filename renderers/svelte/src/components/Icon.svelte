<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry, BoundProperty } from '../core/types.js';

  interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
  }

  let { props }: Props = $props();

  const name = $derived(props.name?.value);
  const iconName = $derived(
    typeof name === 'object' && name?.path ? name.path : (name ?? '')
  );
  const isPath = $derived(typeof name === 'object' && name?.path);
</script>

{#if isPath}
  <svg class="a2ui-icon custom-path" viewBox="0 0 24 24">
    <path d={iconName} fill="currentColor" />
  </svg>
{:else}
  <span class="a2ui-icon">{iconName}</span>
{/if}
