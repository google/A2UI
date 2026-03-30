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

  const label = $derived(props.label?.value ?? '');
  const variant = $derived(props.variant?.value ?? 'mutuallyExclusive');
  const displayStyle = $derived(props.displayStyle?.value ?? 'checkbox');
  const options = $derived(props.options?.value ?? []);
  const selectedValue = $derived(props.value?.value);

  const isMultiple = $derived(variant === 'multipleSelection');

  function isSelected(value: string): boolean {
    const selected = selectedValue;
    if (Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  }

  function updateValue(value: string, active: boolean) {
    const current = selectedValue;
    if (isMultiple) {
      let next = Array.isArray(current) ? [...current] : [];
      if (active) {
        if (!next.includes(value)) next.push(value);
      } else {
        next = next.filter((v: string) => v !== value);
      }
      props.value?.onUpdate(next);
    } else {
      if (active) {
        props.value?.onUpdate([value]);
      }
    }
  }

  function onCheckChange(value: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    updateValue(value, checked);
  }

  function toggleChip(value: string) {
    updateValue(value, !isSelected(value));
  }
</script>

<div class="a2ui-choice-picker">
  {#if label}
    <span class="a2ui-choice-picker-label">{label}</span>
  {/if}

  {#if displayStyle === 'chips'}
    <div class="a2ui-chips-group">
      {#each options as option (option.value)}
        <button
          class="a2ui-chip"
          class:active={isSelected(option.value)}
          onclick={() => toggleChip(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {:else}
    <div class="a2ui-options-group">
      {#each options as option (option.value)}
        <label class="a2ui-option-label">
          <input
            type={isMultiple ? 'checkbox' : 'radio'}
            name={componentId}
            value={option.value}
            checked={isSelected(option.value)}
            onchange={(e) => onCheckChange(option.value, e)}
            class="a2ui-option-input"
          />
          <span class="a2ui-option-text">{option.label}</span>
        </label>
      {/each}
    </div>
  {/if}
</div>
