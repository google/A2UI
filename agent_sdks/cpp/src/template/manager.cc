#include "a2ui/template/manager.h"
#include <stdexcept>

namespace a2ui {

std::string A2uiTemplateManager::generate_system_prompt(
    const std::string& role_description,
    const std::string& workflow_description,
    const std::string& ui_description,
    const std::optional<nlohmann::json>& client_ui_capabilities,
    const std::optional<std::vector<std::string>>& allowed_components,
    const std::optional<std::vector<std::string>>& allowed_messages,
    bool include_schema,
    bool include_examples,
    bool validate_examples
) {
    throw std::runtime_error("This method is not yet implemented.");
}

} // namespace a2ui
