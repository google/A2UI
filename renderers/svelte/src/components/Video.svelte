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
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video class="a2ui-video" src={url} controls>
  <track kind="captions" />
</video>
