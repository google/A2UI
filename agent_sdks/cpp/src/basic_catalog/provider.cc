// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
        std::string(BASIC_CATALOG_NAME),
        std::make_shared<BundledCatalogProvider>(version),
        examples_path
    };
}

} // namespace basic_catalog
} // namespace a2ui
