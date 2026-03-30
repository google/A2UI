<script lang="ts">let { props, componentId } = $props();
const fieldId = $derived(`a2ui-slider-${componentId}`);
const label = $derived(props.label?.value ?? '');
const min = $derived(props.min?.value ?? 0);
const max = $derived(props.max?.value ?? 100);
const value = $derived(props.value?.value ?? 0);
function handleInput(event) {
    const target = event.target;
    props.value?.onUpdate(Number(target.value));
}
export {};
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
