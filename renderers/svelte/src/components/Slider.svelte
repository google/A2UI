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

  let { props, componentId }: Props = $props();

  const fieldId = $derived(`a2ui-slider-${componentId}`);
  const label = $derived(props.label?.value ?? '');
  const min = $derived(props.min?.value ?? 0);
  const max = $derived(props.max?.value ?? 100);
  const value = $derived(props.value?.value ?? 0);

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    props.value?.onUpdate(Number(target.value));
  }
</script>

<div class="a2ui-slider">
  {#if label}
    <label class="a2ui-slider-label" for={fieldId}>{label}</label>
  {/if}
  <input
    id={fieldId}
    type="range"
    class="a2ui-slider-input"
    min={min}
    max={max}
    value={value}
    oninput={handleInput}
  />
  <span class="a2ui-slider-value">{value}</span>
</div>
