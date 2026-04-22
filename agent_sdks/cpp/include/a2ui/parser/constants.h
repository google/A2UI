/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <string_view>

namespace a2ui {

inline constexpr std::string_view DEFAULT_ROOT_ID = "root";

// Message types (v0.8)
inline constexpr std::string_view MSG_TYPE_BEGIN_RENDERING = "beginRendering";
inline constexpr std::string_view MSG_TYPE_SURFACE_UPDATE = "surfaceUpdate";
inline constexpr std::string_view MSG_TYPE_DATA_MODEL_UPDATE = "dataModelUpdate";
inline constexpr std::string_view MSG_TYPE_DELETE_SURFACE = "deleteSurface";

// Message types (v0.9)
inline constexpr std::string_view MSG_TYPE_CREATE_SURFACE = "createSurface";
inline constexpr std::string_view MSG_TYPE_UPDATE_COMPONENTS = "updateComponents";
inline constexpr std::string_view MSG_TYPE_UPDATE_DATA_MODEL = "updateDataModel";

// Conversational text (non-A2UI)
inline constexpr std::string_view MSG_TYPE_TEXT = "text";

} // namespace a2ui
