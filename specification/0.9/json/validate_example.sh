#!/bin/bash

# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

SERVER_SCHEMA="server_to_client.json"
COMMON_TYPES="common_types.json"
COMPONENT_CATALOG="standard_catalog_definition.json"
EXAMPLE_FILE="contact_form_example.jsonl"
i=0
while read -r line; do
  ((i++))
  TEMP_FILE="example_line_${i}.json"
  echo "$line" | jq '.' > "${TEMP_FILE}"
  if [ $? -ne 0 ]; then
    echo "jq failed to parse line: $line"
    rm "${TEMP_FILE}"
    continue
  fi
  pnpx ajv-cli validate --verbose --strict=false -s "${SERVER_SCHEMA}" -r "${COMMON_TYPES}" -r "${COMPONENT_CATALOG}" -r "expression_types.json" --spec=draft2020 -d "${TEMP_FILE}"
  if [ $? -ne 0 ]; then
    echo "Validation failed for line: $line"
  fi
  rm "${TEMP_FILE}"
done < "${EXAMPLE_FILE}"

echo "Validation complete."
