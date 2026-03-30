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
  const description = $derived(props.description?.value ?? '');
</script>

<div class="a2ui-audio-player">
  {#if description}
    <span class="a2ui-audio-description">{description}</span>
  {/if}
  <audio class="a2ui-audio" src={url} controls></audio>
</div>
