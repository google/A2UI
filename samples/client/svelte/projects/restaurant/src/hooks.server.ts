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

import type { Handle } from '@sveltejs/kit';
import { sendA2AMessage } from '@a2ui-samples/lib/middleware';

const SERVER_URL = 'http://localhost:10002';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/a2a' && event.request.method === 'POST') {
		try {
			const body = await event.request.text();
			const result = await sendA2AMessage(SERVER_URL, body);
			return new Response(JSON.stringify(result), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error) {
			console.error('A2A Error:', error);
			return new Response(JSON.stringify({ error: String(error) }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}
	return resolve(event);
};
