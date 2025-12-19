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
import { A2UIRenderer } from "@a2ui/react";
import { useClient } from "./hooks/useClient";
import "./App.css";

function App() {
  const { surfaces, isLoading, makeRequest } = useClient();
  const [hasData, setHasData] = useState(false);
  const [inputValue, setInputValue] = useState("Casey Smith");

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

  if (isLoading) {
    return (
      <div className="app">
        <div className="pending">
          <div className="spinner" />
          <span>Awaiting an answer...</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="app">
        <form onSubmit={handleSubmit}>
          <h1>Contact Finder</h1>
          <div className="input-group">
            <input
              type="text"
              name="body"
              id="body"
              required
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder="Enter a name..."
            />
            <button type="submit" disabled={isLoading}>
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
    );
  }

  return (
    <div className="app">
      <div className="surfaces">
        {Array.from(surfaces.entries()).map(([surfaceId]) => (
          <A2UIRenderer key={surfaceId} surfaceId={surfaceId} className="surface" />
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
        New Search
      </button>
    </div>
  );
}

export default App;
