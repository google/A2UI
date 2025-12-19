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

import { useMemo } from "react";
import { A2aChatCanvas, A2AService, A2AServiceResponse } from "@a2ui/a2a-chat-canvas";
import { Part } from "@a2a-js/sdk";
import "./App.css";

function useA2AService(): A2AService {
  return useMemo(
    () => ({
      async sendMessage(text: string): Promise<A2AServiceResponse> {
        const response = await fetch("/a2a", {
          method: "POST",
          body: text,
        });

        if (!response.ok) {
          const error = (await response.json()) as { error: string };
          throw new Error(error.error);
        }

        const parts = (await response.json()) as Part[];
        return { parts };
      },

      async getAgentCard(): Promise<{ name: string; iconUrl?: string }> {
        const response = await fetch("/a2a/agent-card");

        if (!response.ok) {
          throw new Error("Failed to fetch agent card");
        }

        const card = await response.json();
        return { name: card.name, iconUrl: card.iconUrl };
      },
    }),
    []
  );
}

function App() {
  const service = useA2AService();

  const emptyHistoryContent = (
    <div className="welcome">
      <div className="app-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v3h4v-2.18l4-4 4 4V19h4v-3h-2z" />
        </svg>
      </div>
      <h1 className="app-title">Orchestrator</h1>
      <p className="welcome-text">
        I coordinate multiple agents to help you accomplish complex tasks. Just
        describe what you need, and I&apos;ll route your request to the right
        agents.
      </p>
    </div>
  );

  return (
    <div className="app">
      <A2aChatCanvas service={service} emptyHistoryContent={emptyHistoryContent} />
    </div>
  );
}

export default App;
