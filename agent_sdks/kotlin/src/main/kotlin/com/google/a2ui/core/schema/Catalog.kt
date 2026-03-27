/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

@file:JvmName("CatalogApi")

package com.google.a2ui.core.schema

import java.io.File
import java.util.logging.Logger
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive

/**
 * Configuration for a catalog of components.
 *
 * A catalog consists of a provider that knows how to load the schema, and optionally a path to
 * examples.
 */
data class CatalogConfig(
  @JvmField val name: String,
  @JvmField val provider: A2uiCatalogProvider,
  @JvmField val examplesPath: String? = null,
) {
  companion object {
    /** Create a [CatalogConfig] using a [FileSystemCatalogProvider]. */
    @JvmStatic
    @JvmOverloads
    fun fromPath(name: String, catalogPath: String, examplesPath: String? = null): CatalogConfig =
      CatalogConfig(name, FileSystemCatalogProvider(catalogPath), examplesPath)
  }
}

/** Represents a processed component catalog with its schema. */
data class A2uiCatalog(
  @JvmField val version: A2uiVersion,
  @JvmField val name: String,
  @JvmField val serverToClientSchema: JsonObject,
  @JvmField val commonTypesSchema: JsonObject,
  @JvmField val catalogSchema: JsonObject,
) {

  private val logger = Logger.getLogger(A2uiCatalog::class.java.name)

  val validator: A2uiValidator by lazy { A2uiValidator(this) }

  val catalogId: String
    get() {
      val idElement = catalogSchema[A2uiConstants.CATALOG_ID_KEY]
      require(idElement is JsonPrimitive && idElement.isString) {
        "Catalog '$name' missing catalogId"
      }
      return idElement.content
    }

  /**
   * Returns a new catalog with only allowed components.
   *
   * @param allowedComponents List of component names to include.
   * @return A copy of the catalog with only allowed components.
   */
  fun withPrunedComponents(allowedComponents: List<String>): A2uiCatalog {
    if (allowedComponents.isEmpty()) return this

    val schemaCopy = catalogSchema.toMutableMap()

    // Filter components listing
    (schemaCopy[A2uiConstants.CATALOG_COMPONENTS_KEY] as? JsonObject)?.let { components ->
      schemaCopy[A2uiConstants.CATALOG_COMPONENTS_KEY] =
        JsonObject(components.filterKeys { it in allowedComponents })
    }

    // Filter anyComponent oneOf if it exists
    (schemaCopy["\$defs"] as? JsonObject)?.let { defsElement ->
      (defsElement["anyComponent"] as? JsonObject)?.let { anyCompElement ->
        val newAnyComp = pruneAnyComponentOneOf(anyCompElement, allowedComponents)
        val newDefs = defsElement.toMutableMap().apply { put("anyComponent", newAnyComp) }
        schemaCopy["\$defs"] = JsonObject(newDefs)
      }
    }

    return copy(catalogSchema = JsonObject(schemaCopy))
  }

  private fun pruneAnyComponentOneOf(
    anyCompElement: JsonObject,
    allowedComponents: List<String>,
  ): JsonObject {
    val oneOfElement = anyCompElement["oneOf"] as? JsonArray ?: return anyCompElement

    val filteredOneOf =
      oneOfElement.filter { item ->
        val ref = (item as? JsonObject)?.get("\$ref")?.jsonPrimitive?.content
        if (ref != null && ref.startsWith("#/${A2uiConstants.CATALOG_COMPONENTS_KEY}/")) {
          val compName = ref.split("/").last()
          compName in allowedComponents
        } else {
          true // Keep external refs or non-matching refs
        }
      }

    return JsonObject(anyCompElement + ("oneOf" to JsonArray(filteredOneOf)))
  }

  /** Renders the catalog and schema as LLM instructions. */
  fun renderAsLlmInstructions(): String = buildString {
    appendLine(A2uiConstants.A2UI_SCHEMA_BLOCK_START)
    val jsonFmt = Json

    appendLine("### Server To Client Schema:")
    appendLine(jsonFmt.encodeToString(JsonElement.serializer(), serverToClientSchema))

    if (commonTypesSchema.isNotEmpty()) {
      appendLine("\n### Common Types Schema:")
      appendLine(jsonFmt.encodeToString(JsonElement.serializer(), commonTypesSchema))
    }

    appendLine("\n### Catalog Schema:")
    appendLine(jsonFmt.encodeToString(JsonElement.serializer(), catalogSchema))

    append("\n${A2uiConstants.A2UI_SCHEMA_BLOCK_END}")
  }

  /** Loads and validates examples from a directory. */
  @JvmOverloads
  fun loadExamples(path: String?, validate: Boolean = false): String {
    if (path.isNullOrEmpty()) return ""
    val dir = File(path)
    if (!dir.isDirectory) {
      logger.warning("Example path $path is not a directory")
      return ""
    }

    val files = dir.listFiles { _, name -> name.endsWith(".json") } ?: emptyArray()

    return files
      .mapNotNull { file ->
        val basename = file.nameWithoutExtension
        try {
          val content = file.readText()
          if (validate && !validateExample(file.path, content)) {
            null
          } else {
            "---BEGIN $basename---\n$content\n---END $basename---"
          }
        } catch (e: Exception) {
          logger.warning("Failed to load example ${file.path}: ${e.message}")
          null
        }
      }
      .joinToString("\n\n")
  }

  private fun validateExample(fullPath: String, content: String): Boolean =
    try {
      val jsonElement = Json.parseToJsonElement(content)
      validator.validate(jsonElement)
      true
    } catch (e: Exception) {
      logger.warning("Failed to validate example $fullPath: ${e.message}")
      false
    }
}
