<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry, BoundProperty } from '../core/types.js';
  import ComponentHost from '../core/ComponentHost.svelte';
  import { dispatchAction } from '../core/use-component.svelte.js';

  interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
  }

  let { props, surface, componentId, dataContextPath, registry }: Props = $props();

  const variant = $derived(props.variant?.value ?? 'default');
  const child = $derived(props.child?.value);

  function handleClick() {
    dispatchAction(surface, props.action?.raw, componentId, dataContextPath);
  }
</script>

<button
  type={variant === 'primary' ? 'submit' : 'button'}
  class="a2ui-button {variant}"
  onclick={handleClick}
>
  {#if child}
    <ComponentHost
      {surface}
      componentId={child}
      {dataContextPath}
      {registry}
    />
  {/if}
</button>
