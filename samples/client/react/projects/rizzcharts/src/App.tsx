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

import { useState, useCallback } from "react";
import { RizzchartsRenderer } from "./components/RizzchartsRenderer";
import { useClient } from "./hooks/useClient";
import "./App.css";

const SUGGESTION_CHIPS = [
  { icon: "pie_chart", text: "Show me sales data for Q1" },
  { icon: "analytics", text: "Show me 2024-Q3 sales report" },
  { icon: "local_mall", text: "Which stores have unique sales trends?" },
];

function App() {
  const { surfaces, isLoading, makeRequest } = useClient();
  const [hasData, setHasData] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (inputValue.trim()) {
        await makeRequest(inputValue);
        setHasData(true);
      }
    },
    [inputValue, makeRequest]
  );

  const handleSuggestionClick = useCallback(
    async (text: string) => {
      setInputValue(text);
      await makeRequest(text);
      setHasData(true);
    },
    [makeRequest]
  );

  if (isLoading) {
    return (
      <div className="app">
        <div className="pending">
          <div className="spinner" />
          <span>Analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="app">
        <div className="welcome">
          <div className="agent-header">
            <div className="agent-icon">
              <img src="/rizz-agent.png" alt="Rizz agent icon" className="agent-image" />
            </div>
            <div className="agent-name">
              <strong>RizzCharts</strong>
            </div>
          </div>

          <p className="welcome-text">
            I help you understand and visualize sales pipelines and analyze customer
            performance data.
          </p>

          <div className="suggestion-chips">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.text}
                className="chip"
                onClick={() => handleSuggestionClick(chip.text)}
                disabled={isLoading}
              >
                <ChartIcon type={chip.icon} />
                {chip.text}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-group">
              <input
                type="text"
                name="body"
                id="body"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask me about your data..."
              />
              <button type="submit" disabled={isLoading || !inputValue.trim()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="surfaces">
        {Array.from(surfaces.entries()).map(([surfaceId]) => (
          <RizzchartsRenderer key={surfaceId} surfaceId={surfaceId} className="surface" />
        ))}
      </div>

      <button className="back-button" onClick={() => setHasData(false)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        New Query
      </button>
    </div>
  );
}

interface ChartIconProps {
  type: string;
}

function ChartIcon({ type }: ChartIconProps) {
  switch (type) {
    case "pie_chart":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z" />
        </svg>
      );
    case "analytics":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      );
    case "local_mall":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z" />
        </svg>
      );
    default:
      return null;
  }
}

export default App;
