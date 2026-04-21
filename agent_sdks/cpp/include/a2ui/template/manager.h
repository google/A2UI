#pragma once

#include "a2ui/inference_strategy.h"

namespace a2ui {

class A2uiTemplateManager : public InferenceStrategy {
public:
    A2uiTemplateManager() = default;
    
    std::string generate_system_prompt(
        const std::string& role_description,
        const std::string& workflow_description = "",
        const std::string& ui_description = "",
        const std::optional<nlohmann::json>& client_ui_capabilities = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_components = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_messages = std::nullopt,
        bool include_schema = false,
        bool include_examples = false,
        bool validate_examples = false
    ) override;
};

} // namespace a2ui
