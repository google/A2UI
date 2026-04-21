#pragma once

#include <string>

namespace a2ui {

const std::string DEFAULT_ROOT_ID = "root";

// Message types (v0.8)
const std::string MSG_TYPE_BEGIN_RENDERING = "beginRendering";
const std::string MSG_TYPE_SURFACE_UPDATE = "surfaceUpdate";
const std::string MSG_TYPE_DATA_MODEL_UPDATE = "dataModelUpdate";
const std::string MSG_TYPE_DELETE_SURFACE = "deleteSurface";

// Message types (v0.9)
const std::string MSG_TYPE_CREATE_SURFACE = "createSurface";
const std::string MSG_TYPE_UPDATE_COMPONENTS = "updateComponents";
const std::string MSG_TYPE_UPDATE_DATA_MODEL = "updateDataModel";

// Conversational text (non-A2UI)
const std::string MSG_TYPE_TEXT = "text";

} // namespace a2ui
