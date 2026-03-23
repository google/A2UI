<script lang="ts">let { props } = $props();
const url = $derived(props.url?.value ?? '');
export {};
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video class="a2ui-video" src={url} controls>
  <track kind="captions" />
</video>
