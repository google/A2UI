<script lang="ts">let { props } = $props();
const url = $derived(props.url?.value ?? '');
const fit = $derived(props.fit?.value ?? 'fill');
const variant = $derived(props.variant?.value ?? 'mediumFeature');
const objectFit = $derived(fit === 'scaleDown' ? 'scale-down' : fit);
export {};
</script>

<img
  class="a2ui-image {variant}"
  src={url}
  alt=""
  style:object-fit={objectFit}
/>
