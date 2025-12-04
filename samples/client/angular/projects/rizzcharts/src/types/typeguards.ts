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

/**
 * Type guards for chat_canvas Sender union.
 *
 * These helpers make it easy to narrow `Sender` to `UiAgent` or `UiUser` at
 * runtime and give TypeScript proper narrowed types for downstream code and
 * templates.
 */
import { Role, UiAgent, UiUser } from './ui_message';

/** Returns true when the sender is a UiAgent. */
export function isUiAgent(role: Role | null | undefined): role is UiAgent {
  return !!role && (role as any).type === 'ui_agent';
}

/** Returns true when the sender is a UiUser. */
export function isUiUser(role: Role | null | undefined): role is UiUser {
  return !!role && (role as any).kind === 'ui_user';
}

// Convenience default export for template binding if desired.
export default {
  isUiAgent,
  isUiUser,
};
