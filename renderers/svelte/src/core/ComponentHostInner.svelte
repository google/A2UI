<!--
  ComponentHostInner: the actual binding + rendering logic.

  Separated from ComponentHost so that {#key} in the parent forces
  full teardown when componentId/dataContextPath changes.
  This ensures $state and $effect in createComponentBinding() get
  proper lifecycle (created once, cleaned up on destroy).
-->
<script lang="ts">
  import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
  import type { ComponentRegistry } from './types.js';
  import { createComponentBinding } from './use-component.svelte.js';

  interface Props {
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
  }

  let {
    surface,
    componentId,
    dataContextPath,
    registry,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  //
  // These values are stable for this instance's lifetime.
  // The parent ComponentHost uses {#key componentId:dataContextPath}
  // to destroy and recreate this component when identity changes.
  // Capturing initial prop values is intentional and correct here.
  const componentModel = surface.componentsModel.get(componentId);
  const componentType = componentModel?.type;
  const Component = componentType ? registry.get(componentType) : undefined;

  // Bind at the top level — $state/$effect run in component script context
  const binding = componentModel
    ? createComponentBinding(surface, componentId, dataContextPath)
    : undefined;

  const theme = surface.theme ?? {};
</script>

{#if Component && binding}
  <Component
    props={binding.props}
    {surface}
    {componentId}
    {dataContextPath}
    {registry}
    {theme}
  />
{:else if componentType}
  <div class="a2ui-unknown" data-a2ui-type={componentType}>
    Unknown component: {componentType}
  </div>
{/if}
