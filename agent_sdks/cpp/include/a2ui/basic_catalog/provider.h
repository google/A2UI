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
