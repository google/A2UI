<script lang="ts">import ComponentHost from '../core/ComponentHost.svelte';
let { props, surface, dataContextPath, registry } = $props();
const trigger = $derived(props.trigger?.value);
const content = $derived(props.content?.value);
let isOpen = $state(false);
let dialogRef = $state();
function openModal() {
    isOpen = true;
    // Use the native <dialog> API for proper a11y (focus trapping, Escape key, etc.)
    dialogRef?.showModal();
}
function closeModal() {
    isOpen = false;
    dialogRef?.close();
}
function handleDialogClose() {
    // Handles native Escape key close
    isOpen = false;
}
function handleBackdropClick(event) {
    // Only close if clicking the backdrop, not the content
    if (event.target === dialogRef) {
        closeModal();
    }
}
</script>

<div class="a2ui-modal">
  <button
    type="button"
    class="a2ui-modal-trigger"
    onclick={openModal}
    aria-haspopup="dialog"
  >
    {#if trigger}
      <ComponentHost
        {surface}
        componentId={trigger}
        {dataContextPath}
        {registry}
      />
    {/if}
  </button>

  <dialog
    bind:this={dialogRef}
    class="a2ui-modal-dialog"
    onclose={handleDialogClose}
    onclick={handleBackdropClick}
  >
    <div class="a2ui-modal-content">
      <button
        type="button"
        class="a2ui-modal-close"
        onclick={closeModal}
        aria-label="Close"
      >&times;</button>
      {#if content && isOpen}
        <ComponentHost
          {surface}
          componentId={content}
          {dataContextPath}
          {registry}
        />
      {/if}
    </div>
  </dialog>
</div>
