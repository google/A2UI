/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AppConfig } from "./types.js";
import { contactsThemeSheet } from "../theme/contacts-theme.js";

export const config: AppConfig = {
  key: "contacts",
  title: "Contact Manager",
  placeholder: "Alex Jordan",
  loadingText: [
    "Searching contacts...",
    "Looking up details...",
    "Verifying information...",
    "Just a moment...",
  ],
  serverUrl: "http://localhost:10003",
  cssOverrides: contactsThemeSheet,
};

