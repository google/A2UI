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
  }

  let { props, surface, dataContextPath, registry }: Props = $props();

  const tabs = $derived(props.tabs?.value ?? []);

  let activeTabIndex = $state(0);

  const activeTab = $derived(tabs[activeTabIndex]);

  function setActiveTab(index: number) {
    activeTabIndex = index;
  }
</script>

<div class="a2ui-tabs">
  <div class="a2ui-tab-bar">
    {#each tabs as tab, i (i)}
      <button
        class="a2ui-tab-button"
        class:active={activeTabIndex === i}
        onclick={() => setActiveTab(i)}
      >
        {tab.label ?? tab.title ?? ''}
      </button>
    {/each}
  </div>
  {#if activeTab}
    <div class="a2ui-tab-content">
      <ComponentHost
        {surface}
        componentId={activeTab.content ?? activeTab.child}
        {dataContextPath}
        {registry}
      />
    </div>
  {/if}
</div>
