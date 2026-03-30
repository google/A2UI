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

  const url = $derived(props.url?.value ?? '');
  const fit = $derived(props.fit?.value ?? 'fill');
  const variant = $derived(props.variant?.value ?? 'mediumFeature');

  const objectFit = $derived(
    fit === 'scaleDown' ? 'scale-down' : fit
  );
</script>

<img
  class="a2ui-image {variant}"
  src={url}
  alt=""
  style:object-fit={objectFit}
/>
