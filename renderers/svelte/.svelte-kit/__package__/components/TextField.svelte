<script lang="ts">let { props, componentId } = $props();
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
function handleInput(event) {
    const target = event.target;
    props.value?.onUpdate(target.value);
}
function handleBlur(event) {
    // Re-commit the value on blur to ensure data model is synced
    const target = event.target;
    props.value?.onUpdate(target.value);
}
export {};
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
