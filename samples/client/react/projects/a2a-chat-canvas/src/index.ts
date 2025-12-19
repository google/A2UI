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

// Components
export { A2aChatCanvas } from "./components/A2aChatCanvas";
export { Chat } from "./components/Chat";
export { ChatHistory } from "./components/ChatHistory";
export { InputArea } from "./components/InputArea";
export { Canvas } from "./components/Canvas";
export { Message } from "./components/Message";

// Context
export { ChatProvider, useChatContext } from "./context/ChatContext";

// Types
export type {
  UiMessage,
  UiAgent,
  UiUser,
  UiRole,
  UiMessageStatus,
  UiMessageContent,
  A2aChatCanvasProps,
  MessageDecoratorProps,
  ChatServiceState,
  CanvasServiceState,
  A2AServiceConfig,
  A2AService,
  A2AServiceResponse,
} from "./types";

// Utils
export {
  extractA2aPartsFromResponse,
  extractA2uiDataParts,
  isA2uiDataPart,
  convertPartToUiMessageContent,
  formatTimestamp,
} from "./utils";
