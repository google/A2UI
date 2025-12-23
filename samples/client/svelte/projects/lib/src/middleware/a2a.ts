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

import { A2AClient } from '@a2a-js/sdk/client';
import type { MessageSendParams, Part, SendMessageSuccessResponse, Task } from '@a2a-js/sdk';
import { v4 as uuidv4 } from 'uuid';

export const A2AUI_MIME_TYPE = 'application/json+a2aui';

const fetchWithCustomHeader: typeof fetch = async (url, init) => {
	const headers = new Headers(init?.headers);
	headers.set('X-A2A-Extensions', 'https://a2ui.org/a2a-extension/a2ui/v0.8');

	const newInit = { ...init, headers };
	return fetch(url, newInit);
};

const isJson = (str: string): boolean => {
	try {
		const parsed = JSON.parse(str);
		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
	} catch {
		return false;
	}
};

// Cache clients per server URL to support multiple backends
const clients = new Map<string, A2AClient>();

/**
 * Creates or retrieves a cached A2AClient for the given server URL.
 */
export const createOrGetClient = async (serverUrl: string): Promise<A2AClient> => {
	let client = clients.get(serverUrl);
	if (!client) {
		// Create a client pointing to the agent's Agent Card URL.
		client = await A2AClient.fromCardUrl(`${serverUrl}/.well-known/agent-card.json`, {
			fetchImpl: fetchWithCustomHeader
		});
		clients.set(serverUrl, client);
	}

	return client;
};

/**
 * Sends a message to the A2A server and returns the A2UI messages.
 * Handles both JSON UI events and plain text queries.
 */
export const sendA2AMessage = async (
	serverUrl: string,
	body: string
): Promise<Record<string, unknown>[]> => {
	let sendParams: MessageSendParams;

	if (isJson(body)) {
		console.log('[a2a-middleware] Received JSON UI event:', body);

		const clientEvent = JSON.parse(body);
		sendParams = {
			message: {
				messageId: uuidv4(),
				role: 'user',
				parts: [
					{
						kind: 'data',
						data: clientEvent,
						metadata: { mimeType: A2AUI_MIME_TYPE }
					} as Part
				],
				kind: 'message'
			}
		};
	} else {
		console.log('[a2a-middleware] Received text query:', body);
		sendParams = {
			message: {
				messageId: uuidv4(),
				role: 'user',
				parts: [
					{
						kind: 'text',
						text: body
					}
				],
				kind: 'message'
			}
		};
	}

	const a2aClient = await createOrGetClient(serverUrl);
	const response = await a2aClient.sendMessage(sendParams);

	if ('error' in response) {
		console.error('Error:', response.error.message);
		throw new Error(response.error.message);
	}

	const result = (response as SendMessageSuccessResponse).result as Task;
	if (result.kind === 'task' && result.status.message?.parts) {
		// Extract A2UI messages from data parts
		const messages: Record<string, unknown>[] = [];
		for (const part of result.status.message.parts) {
			if (part.kind === 'data') {
				messages.push(part.data as Record<string, unknown>);
			}
		}
		return messages;
	}

	return [];
};
