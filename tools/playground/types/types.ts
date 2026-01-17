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

import { HTMLTemplateResult } from "lit";

/**
 * Represents a chat message in the conversation
 */
export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    a2uiMessages?: import("@a2ui/lit").v0_8.Types.ServerToClientMessage[];
}

/**
 * Agent configuration
 */
export interface AgentConfig {
    systemPrompt: string;
    catalogId: string;
    temperature: number;
}

/**
 * Snackbar notification types
 */
export enum SnackType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error",
}

/**
 * Snackbar action button
 */
export interface SnackbarAction {
    label: string;
    handler: () => void;
}

/**
 * Snackbar message
 */
export type SnackbarUUID = string;

export interface SnackbarMessage {
    id: SnackbarUUID;
    message: string | HTMLTemplateResult;
    type: SnackType;
    persistent: boolean;
    actions: SnackbarAction[];
}
