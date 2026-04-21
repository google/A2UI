#pragma once

#include "a2ui/schema/catalog.h"
#include "a2ui/basic_catalog/constants.h"
#include <string>
#include <optional>
#include <nlohmann/json.hpp>

namespace a2ui {
namespace basic_catalog {

class BundledCatalogProvider : public A2uiCatalogProvider {
public:
    explicit BundledCatalogProvider(std::string version);
    nlohmann::json load() override;
private:
    std::string version_;
};

class BasicCatalog {
public:
    static CatalogConfig get_config(const std::string& version, const std::optional<std::string>& examples_path = std::nullopt);
};

} // namespace basic_catalog
} // namespace a2ui
