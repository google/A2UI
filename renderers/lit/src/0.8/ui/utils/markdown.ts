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
import { TemplateResult } from "lit";
import { createContext } from "@lit/context";

/**
 * The interface for the markdown renderer that can be injected into the
 * Lit context.
 */
export interface MarkdownRenderer {
  render(markdown: string) : TemplateResult;
}

/**
 * A Lit Context to override the default (noop) markdown renderer.
 */
export const markdownContext = createContext<MarkdownRenderer>(
  Symbol("a2ui-lit-markdown-renderer")
);
