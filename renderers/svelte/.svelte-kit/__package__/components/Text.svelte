<script lang="ts">let { props } = $props();
const text = $derived(props.text?.value ?? '');
const variant = $derived(props.variant?.value ?? 'body');
export {};
</script>

<span class="a2ui-text {variant}">{text}</span>
