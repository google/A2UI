<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry, BoundProperty } from '../core/types.js';
  import ComponentHost from '../core/ComponentHost.svelte';

  interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
    theme?: any;
  }

  let { props, surface, dataContextPath, registry }: Props = $props();

  const trigger = $derived(props.trigger?.value);
  const content = $derived(props.content?.value);

  let isOpen = $state(false);
  let dialogRef: HTMLDialogElement | undefined = $state();

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

  function handleBackdropClick(event: MouseEvent) {
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
