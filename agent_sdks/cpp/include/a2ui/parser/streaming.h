#pragma once

#include "a2ui/schema/catalog.h"
#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>
#include <memory>
#include "a2ui/parser/response_part.h"

namespace a2ui {

class A2uiStreamParser {
public:
    virtual ~A2uiStreamParser() = default;
    virtual std::vector<ResponsePart> process_chunk(const std::string& chunk) = 0;

    virtual std::string get_active_msg_type_for_components() const = 0;
    virtual std::string get_data_model_msg_type() const = 0;
    virtual bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) = 0;

    // Factory function
    static std::unique_ptr<A2uiStreamParser> create(A2uiCatalog catalog);
};

} // namespace a2ui
