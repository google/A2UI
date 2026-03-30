<script lang="ts">import ComponentHost from '../core/ComponentHost.svelte';
import { dispatchAction } from '../core/use-component.svelte.js';
let { props, surface, componentId, dataContextPath, registry } = $props();
const variant = $derived(props.variant?.value ?? 'default');
const child = $derived(props.child?.value);
function handleClick() {
    dispatchAction(surface, props.action?.raw, componentId, dataContextPath);
}
</script>

<button
  type={variant === 'primary' ? 'submit' : 'button'}
  class="a2ui-button {variant}"
  onclick={handleClick}
>
  {#if child}
    <ComponentHost
      {surface}
      componentId={child}
      {dataContextPath}
      {registry}
    />
  {/if}
</button>
