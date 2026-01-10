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
	import { onMount } from 'svelte';
	import { Surface, SvelteMessageProcessor, DEFAULT_CATALOG, type Types } from '@a2ui/svelte';
	import { theme } from '$lib/theme';
	import { config } from '$lib/config';

	// State
	let surfaces = $state<ReadonlyMap<Types.SurfaceID, Types.Surface>>(new Map());
	let isPending = $state(false);
	let loadingTextIndex = $state(0);
	let errorMessage = $state<string | null>(null);
	let hasMessages = $state(false);
	let loadingInterval: ReturnType<typeof setInterval> | null = null;

	// Message processor
	const processor = new SvelteMessageProcessor();

	// Handle action dispatch from components
	processor.onDispatch(async (event) => {
		isPending = true;
		// Clear surfaces immediately when starting a new action
		processor.clearSurfaces();
		surfaces = new Map();
		startLoadingAnimation();
		try {
			const response = await fetch('/a2a', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(event.message)
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const messages = await response.json();
			event.resolve(messages);
			processor.processMessages(messages);
			surfaces = new Map(processor.getSurfaces());
		} catch (error) {
			console.error('Error sending action:', error);
			errorMessage = String(error);
			event.resolve([]);
		} finally {
			isPending = false;
			stopLoadingAnimation();
		}
	});

	function startLoadingAnimation() {
		if (config.loadingMessages.length > 1) {
			loadingTextIndex = 0;
			loadingInterval = setInterval(() => {
				loadingTextIndex = (loadingTextIndex + 1) % config.loadingMessages.length;
			}, 2000);
		}
	}

	function stopLoadingAnimation() {
		if (loadingInterval) {
			clearInterval(loadingInterval);
			loadingInterval = null;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const body = formData.get('body') as string;

		if (!body?.trim()) return;

		isPending = true;
		errorMessage = null;
		startLoadingAnimation();

		try {
			const response = await fetch('/a2a', {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain'
				},
				body: body
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const messages = (await response.json()) as Types.ServerToClientMessage[];

			hasMessages = messages.length > 0;
			processor.clearSurfaces();
			processor.processMessages(messages);
			surfaces = new Map(processor.getSurfaces());
		} catch (error) {
			console.error('Error:', error);
			errorMessage = String(error);
		} finally {
			isPending = false;
			stopLoadingAnimation();
		}
	}

	let isDarkMode = $state(false);

	onMount(() => {
		// Check initial theme from system preference or body class
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const bodyHasDark = document.body.classList.contains('dark');
		const bodyHasLight = document.body.classList.contains('light');

		if (bodyHasDark) {
			isDarkMode = true;
		} else if (bodyHasLight) {
			isDarkMode = false;
		} else {
			// No explicit class set, use system preference
			isDarkMode = prefersDark;
		}

		return () => {
			stopLoadingAnimation();
		};
	});

	function toggleTheme() {
		// Toggle based on current state, not body class
		isDarkMode = !isDarkMode;
		const body = document.body;
		if (isDarkMode) {
			body.classList.remove('light');
			body.classList.add('dark');
		} else {
			body.classList.remove('dark');
			body.classList.add('light');
		}
	}

	let loadingText = $derived(config.loadingMessages[loadingTextIndex] || 'Loading...');
	let showForm = $derived(!isPending && !hasMessages);
</script>

<main>
	<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
		<span class="g-icon filled-heavy">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
	</button>

	{#if showForm}
		<form onsubmit={handleSubmit}>
			{#if config.heroImage}
				<img class="hero-img" src={config.heroImage} alt="Restaurant" />
			{/if}
			<h1 class="app-title">{config.title}</h1>
			<div class="input-row">
				<input
					required
					value={config.placeholder}
					autocomplete="off"
					id="body"
					name="body"
					type="text"
					disabled={isPending}
				/>
				<button type="submit" disabled={isPending}>
					<span class="g-icon filled-heavy">send</span>
				</button>
			</div>
		</form>
	{/if}

	{#if isPending}
		<div class="pending">
			<div class="spinner"></div>
			<div class="loading-text">{loadingText}</div>
		</div>
	{/if}

	{#if errorMessage}
		<div class="error">{errorMessage}</div>
	{/if}

	{#if surfaces.size > 0}
		<section id="surfaces">
			{#each [...surfaces] as [surfaceId, surface] (surfaceId)}
				<Surface {surfaceId} {surface} {processor} {theme} catalog={DEFAULT_CATALOG} />
			{/each}
		</section>
	{/if}
</main>

<style>
	main {
		display: block;
		max-width: 640px;
		margin: 0 auto;
		min-height: 100vh;
		padding: var(--bb-grid-size-3);
	}

	.theme-toggle {
		padding: 0;
		margin: 0;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		top: var(--bb-grid-size-3);
		right: var(--bb-grid-size-4);
		background: light-dark(var(--n-100), var(--n-0));
		border-radius: 50%;
		color: light-dark(var(--p-30), var(--n-90));
		cursor: pointer;
		width: 48px;
		height: 48px;
		font-size: 32px;
		z-index: 100;
	}

	form {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 16px;
		align-items: center;
		padding: 16px 0;
		animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.5s backwards;
	}

	.hero-img {
		max-width: 400px;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 16px;
	}

	form h1 {
		color: light-dark(var(--p-40), var(--n-90));
		margin: 0;
		font-size: 2rem;
		font-weight: 500;
	}

	.input-row {
		display: flex;
		flex: 1;
		gap: 16px;
		align-items: center;
		width: 100%;
	}

	.input-row input {
		display: block;
		flex: 1;
		border-radius: 32px;
		padding: 16px 24px;
		border: 1px solid var(--p-60);
		background: light-dark(var(--n-100), var(--n-10));
		font-size: 16px;
		color: inherit;
	}

	.input-row input:focus {
		outline: 2px solid var(--p-40);
		outline-offset: 2px;
	}

	.input-row button {
		display: flex;
		align-items: center;
		background: var(--p-40);
		color: var(--n-100);
		border: none;
		padding: 12px 20px;
		border-radius: 32px;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.input-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input-row button:not(:disabled):hover {
		opacity: 0.9;
	}

	.pending {
		width: 100%;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
		gap: 16px;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-left-color: var(--p-60);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text {
		color: light-dark(var(--n-40), var(--n-60));
		font-size: 14px;
		animation: pulse 2s ease-in-out infinite;
	}

	.error {
		color: var(--e-40);
		background-color: var(--e-95);
		border: 1px solid var(--e-80);
		padding: 16px;
		border-radius: 8px;
		margin-top: 16px;
	}

	#surfaces {
		width: 100%;
		max-width: 100svw;
		padding: var(--bb-grid-size-3) 0;
		animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
	}
</style>
