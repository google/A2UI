/*
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
 */

import { Data, Types } from '@a2ui/lit/0.8';

export interface DispatchedEvent {
	message: Types.A2UIClientEventMessage;
	resolve: (messages: Types.ServerToClientMessage[]) => void;
}

/**
 * Svelte-specific message processor that extends the base A2uiMessageProcessor.
 * Provides a callback-based dispatch mechanism for user actions.
 */
export class SvelteMessageProcessor extends Data.A2uiMessageProcessor {
	private dispatchCallback?: (event: DispatchedEvent) => void;

	/**
	 * Register a callback to handle dispatched user action events.
	 * The callback receives the message and a resolve function to complete the promise.
	 */
	onDispatch(callback: (event: DispatchedEvent) => void): void {
		this.dispatchCallback = callback;
	}

	/**
	 * Override setData to convert null to undefined for proper default handling.
	 */
	override setData(
		node: Types.AnyComponentNode,
		relativePath: string,
		value: Types.DataValue,
		surfaceId?: Types.SurfaceID | null
	): void {
		return super.setData(node, relativePath, value, surfaceId ?? undefined);
	}

	/**
	 * Dispatch a user action message and return a promise that resolves
	 * when the server responds.
	 */
	dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
		return new Promise((resolve) => {
			if (this.dispatchCallback) {
				this.dispatchCallback({ message, resolve });
			} else {
				console.warn('No dispatch callback registered. Call onDispatch() first.');
				resolve([]);
			}
		});
	}
}
