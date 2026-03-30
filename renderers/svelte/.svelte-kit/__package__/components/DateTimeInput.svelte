<script lang="ts">let { props, componentId } = $props();
const fieldId = $derived(`a2ui-dt-${componentId}`);
const label = $derived(props.label?.value ?? '');
const value = $derived(props.value?.value ?? '');
const enableDate = $derived(props.enableDate?.value ?? false);
const enableTime = $derived(props.enableTime?.value ?? false);
const min = $derived(props.min?.value ?? '');
const max = $derived(props.max?.value ?? '');
const inputType = $derived.by(() => {
    if (enableDate && enableTime)
        return 'datetime-local';
    if (enableTime)
        return 'time';
    return 'date';
});
function handleInput(event) {
    const target = event.target;
    props.value?.onUpdate(target.value);
}
export {};
</script>

<div class="a2ui-datetime-input">
  {#if label}
    <label class="a2ui-datetime-label" for={fieldId}>{label}</label>
  {/if}
  <input
    id={fieldId}
    class="a2ui-datetime-input-field"
    type={inputType}
    value={value}
    min={min || undefined}
    max={max || undefined}
    oninput={handleInput}
  />
</div>
