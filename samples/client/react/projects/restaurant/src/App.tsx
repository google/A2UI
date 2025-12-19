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

import { useState, useCallback, useEffect, useRef } from "react";
import { A2UIRenderer } from "@a2ui/react";
import { useClient } from "./hooks/useClient";
import "./App.css";

const LOADING_TEXT_LINES = [
  "Finding the best spots for you...",
  "Checking reviews...",
  "Looking for open tables...",
  "Almost there...",
];

function App() {
  const { surfaces, isLoading, makeRequest } = useClient();
  const [hasData, setHasData] = useState(false);
  const [inputValue, setInputValue] = useState("Top 5 Chinese restaurants in New York.");
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingTextIndex(0);
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXT_LINES.length);
      }, 2000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

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

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      document.body.classList.toggle("dark", newValue);
      document.body.classList.toggle("light", !newValue);
      return newValue;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="app">
        <div className="pending">
          <div className="spinner" />
          <div className="loading-text">{LOADING_TEXT_LINES[loadingTextIndex]}</div>
        </div>
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="app">
        <form onSubmit={handleSubmit}>
          <img className="hero-img" src="/hero.png" alt="Image of the restaurant" />
          <h1 className="app-title">Restaurant Finder</h1>
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
              placeholder="Search for restaurants..."
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
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
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
      <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
    </div>
  );
}

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
      {isDarkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      )}
    </button>
  );
}

export default App;
