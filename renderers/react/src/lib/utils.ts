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

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for conditional classes with tailwind-merge to handle conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Record<string, boolean> (class map) to a className string.
 * This is used to convert Lit-style class maps to React className strings.
 */
export function classMapToString(classMap: Record<string, boolean>): string {
  return Object.entries(classMap)
    .filter(([, enabled]) => enabled)
    .map(([className]) => className)
    .join(" ");
}
