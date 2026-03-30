<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry, BoundProperty } from '../core/types.js';

  interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
    theme?: any;
  }

  let { props, componentId }: Props = $props();

  const fieldId = $derived(`a2ui-tf-${componentId}`);
  const label = $derived(props.label?.value ?? '');
  const value = $derived(props.value?.value ?? '');
  const variant = $derived(props.variant?.value ?? 'shortText');
  const validationRegexp = $derived(props.validationRegexp?.value);
  const checks = $derived(props.checks?.value);
  const isValid = $derived(props.isValid?.value ?? true);
  const validationErrors = $derived(props.validationErrors?.value ?? []);

  const inputType = $derived.by(() => {
    switch (variant) {
      case 'obscured':
        return 'password';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  });

  const isLongText = $derived(variant === 'longText');

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    props.value?.onUpdate(target.value);
  }

  function handleBlur(event: FocusEvent) {
    // Re-commit the value on blur to ensure data model is synced
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    props.value?.onUpdate(target.value);
  }
</script>

<div class="a2ui-text-field" class:a2ui-invalid={!isValid}>
  {#if label}
    <label class="a2ui-text-field-label" for={fieldId}>{label}</label>
  {/if}
  {#if isLongText}
    <textarea
      id={fieldId}
      class="a2ui-text-field-input"
      value={value}
      oninput={handleInput}
      onblur={handleBlur}
      aria-invalid={!isValid}
    ></textarea>
  {:else}
    <input
      id={fieldId}
      class="a2ui-text-field-input"
      type={inputType}
      value={value}
      oninput={handleInput}
      onblur={handleBlur}
      aria-invalid={!isValid}
    />
  {/if}
  {#if validationErrors.length > 0}
    <div class="a2ui-text-field-errors" role="alert">
      {#each validationErrors as error}
        <span class="a2ui-text-field-error">{error}</span>
      {/each}
    </div>
  {/if}
</div>
