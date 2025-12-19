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

import { Part } from "@a2a-js/sdk";

/**
 * Represents an agent in the UI.
 */
export interface UiAgent {
  type: "ui_agent";
  name: string;
  iconUrl?: string;
  subagentName?: string;
}

/**
 * Represents a user in the UI.
 */
export interface UiUser {
  type: "ui_user";
  name?: string;
  avatarUrl?: string;
}

/**
 * Role of a message sender.
 */
export type UiRole = UiAgent | UiUser;

/**
 * Status of a message.
 */
export type UiMessageStatus = "pending" | "streaming" | "completed" | "error";

/**
 * Content of a message.
 */
export interface UiMessageContent {
  type: "ui_message_content";
  id: string;
  data: Part;
  variant: "default_text_part" | "a2ui_data_part" | string;
}

/**
 * Represents a message in the chat UI.
 */
export interface UiMessage {
  type: "ui_message";
  id: string;
  contextId: string;
  role: UiRole;
  contents: UiMessageContent[];
  status: UiMessageStatus;
  created: string;
  lastUpdated: string;
}

/**
 * A2A service interface for making requests.
 */
export interface A2AServiceConfig {
  agentCardUrl: string;
  fetchImpl?: typeof fetch;
}

/**
 * Custom A2A service interface for proxy-based communication.
 */
export interface A2AService {
  sendMessage: (text: string) => Promise<A2AServiceResponse>;
  getAgentCard: () => Promise<{ name: string; iconUrl?: string }>;
}

/**
 * Response from A2A service.
 */
export interface A2AServiceResponse {
  parts: import("@a2a-js/sdk").Part[];
  subagentCard?: { name: string };
}

/**
 * Props for the A2aChatCanvas component.
 */
export interface A2aChatCanvasProps {
  /** Custom component to render when chat history is empty */
  emptyHistoryContent?: React.ReactNode;
  /** Custom message decorator component */
  messageDecorator?: React.ComponentType<MessageDecoratorProps>;
  /** CSS class name for the container */
  className?: string;
}

/**
 * Props for message decorator components.
 */
export interface MessageDecoratorProps {
  message: UiMessage;
  children: React.ReactNode;
}

/**
 * Chat service state and methods.
 */
export interface ChatServiceState {
  history: UiMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  cancelStream: () => void;
}

/**
 * Canvas service state.
 */
export interface CanvasServiceState {
  surfaceId: string | null;
  isOpen: boolean;
  openCanvas: (surfaceId: string) => void;
  closeCanvas: () => void;
}
