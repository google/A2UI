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

  const label = $derived(props.label?.value ?? '');
  const checked = $derived(!!props.value?.value);

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    props.value?.onUpdate(target.checked);
  }
</script>

<label class="a2ui-checkbox">
  <input
    type="checkbox"
    class="a2ui-checkbox-input"
    checked={checked}
    onchange={handleChange}
  />
  <span class="a2ui-checkbox-label">{label}</span>
</label>
