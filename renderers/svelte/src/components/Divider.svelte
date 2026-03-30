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

  const axis = $derived(props.axis?.value ?? 'horizontal');
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
