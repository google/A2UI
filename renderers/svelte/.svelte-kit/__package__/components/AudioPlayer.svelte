<script lang="ts">let { props } = $props();
const url = $derived(props.url?.value ?? '');
const description = $derived(props.description?.value ?? '');
export {};
</script>

<div class="a2ui-audio-player">
  {#if description}
    <span class="a2ui-audio-description">{description}</span>
  {/if}
  <audio class="a2ui-audio" src={url} controls></audio>
</div>
