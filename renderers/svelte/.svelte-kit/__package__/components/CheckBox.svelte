<script lang="ts">let { props } = $props();
const label = $derived(props.label?.value ?? '');
const checked = $derived(!!props.value?.value);
function handleChange(event) {
    const target = event.target;
    props.value?.onUpdate(target.checked);
}
export {};
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
