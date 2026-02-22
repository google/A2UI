<!--
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

<script lang="ts">
	import type { Types } from '@a2ui/lit/0.8';
	import type { SvelteMessageProcessor } from '../data/processor.js';
	import { classMap, styleMap } from '../utils/classes.js';
	import Renderer from '../rendering/Renderer.svelte';

	interface Props {
		surfaceId: Types.SurfaceID | null;
		component: Types.ModalNode;
		weight: string | number;
		processor: SvelteMessageProcessor;
		theme: Types.Theme;
	}

	let { surfaceId, component, weight, processor, theme }: Props = $props();

	let showDialog = $state(false);
	let dialogElement: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (showDialog && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
		}
	});

	let backdropClasses = $derived(classMap(theme.components.Modal?.backdrop));
	let modalClasses = $derived(classMap(theme.components.Modal?.element));
	let modalStyles = $derived(styleMap(theme.additionalStyles?.Modal));

	function openDialog() {
		showDialog = true;
	}

	function closeDialog() {
		if (dialogElement?.open) {
			dialogElement.close();
		}
		showDialog = false;
	}

	function handleDialogClick(event: MouseEvent) {
		if (event.target instanceof HTMLDialogElement) {
			closeDialog();
		}
	}
</script>

<div class="a2ui-modal-host" style="--weight: {weight}">
	{#if showDialog}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<dialog
			bind:this={dialogElement}
			class={backdropClasses}
			onclick={handleDialogClick}
			onkeydown={(e) => e.key === 'Escape' && closeDialog()}
		>
			<section class={modalClasses} style={modalStyles}>
				<div class="controls">
					<button onclick={closeDialog} aria-label="Close modal">
						<span class="g-icon">close</span>
					</button>
				</div>

				<Renderer {surfaceId} component={component.properties.contentChild} />
			</section>
		</dialog>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<section onclick={openDialog}>
			<Renderer {surfaceId} component={component.properties.entryPointChild} />
		</section>
	{/if}
</div>

<style>
	.a2ui-modal-host {
		display: block;
		flex: var(--weight);
	}

	dialog {
		padding: 0;
		border: none;
		background: none;
	}

	dialog section {
		overflow: auto;
	}

	.controls {
		display: flex;
		justify-content: end;
		margin-bottom: 4px;
	}

	.controls button {
		padding: 0;
		background: none;
		width: 20px;
		height: 20px;
		border: none;
		cursor: pointer;
	}
</style>
