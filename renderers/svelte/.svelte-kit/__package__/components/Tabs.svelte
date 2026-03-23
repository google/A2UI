<script lang="ts">import ComponentHost from '../core/ComponentHost.svelte';
let { props, surface, dataContextPath, registry } = $props();
const tabs = $derived(props.tabs?.value ?? []);
let activeTabIndex = $state(0);
const activeTab = $derived(tabs[activeTabIndex]);
function setActiveTab(index) {
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
