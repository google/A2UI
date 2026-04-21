#include "a2ui/basic_catalog/provider.h"
#include "a2ui/schema/constants.h"
#include <stdexcept>

namespace a2ui {
namespace internal {
extern const char* BASIC_CATALOG_V08;
extern const char* BASIC_CATALOG_V09;
}

namespace basic_catalog {

BundledCatalogProvider::BundledCatalogProvider(std::string version)
    : version_(std::move(version)) {}

nlohmann::json BundledCatalogProvider::load() {
    nlohmann::json resource;
    if (version_ == VERSION_0_8) {
        resource = nlohmann::json::parse(internal::BASIC_CATALOG_V08);
    } else if (version_ == VERSION_0_9) {
        resource = nlohmann::json::parse(internal::BASIC_CATALOG_V09);
    } else {
        throw std::runtime_error("Unknown A2UI version: " + version_);
    }

    if (!resource.contains("catalogId")) {
        std::string rel_path = (version_ == VERSION_0_8) ? "specification/v0_8/json/standard_catalog_definition.json" : "specification/v0_9/json/basic_catalog.json";
        resource["catalogId"] = "https://a2ui.org/" + rel_path;
    }

    if (!resource.contains("$schema")) {
        resource["$schema"] = "https://json-schema.org/draft/2020-12/schema";
    }

    return resource;
}

CatalogConfig BasicCatalog::get_config(const std::string& version, const std::optional<std::string>& examples_path) {
    return CatalogConfig{
        BASIC_CATALOG_NAME,
        std::make_shared<BundledCatalogProvider>(version),
        examples_path
    };
}

} // namespace basic_catalog
} // namespace a2ui
