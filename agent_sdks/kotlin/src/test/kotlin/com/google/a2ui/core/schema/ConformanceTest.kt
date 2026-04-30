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

package com.google.a2ui.core.schema

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import java.io.File
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory

class ConformanceTest {

  private val yamlMapper = ObjectMapper(YAMLFactory())
  private val jsonMapper = ObjectMapper()

  private fun getConformanceFile(filename: String): File {
    return File(REPO_ROOT, "$CONFORMANCE_DIR_PATH$filename")
  }

  private fun loadJsonFile(file: File): JsonObject {
    val jsonStr = file.readText()
    return Json.parseToJsonElement(jsonStr) as JsonObject
  }

  private fun parseConformanceYaml(file: File, conformanceDir: File): List<ConformanceTestCase> {
    val rawList = yamlMapper.readValue(file, Any::class.java) as List<*>

    val baseSchemaMappings = mutableMapOf<String, String>()
    conformanceDir
      .listFiles { _, name -> name.endsWith(".json") }
      ?.forEach { f ->
        baseSchemaMappings["$URL_PREFIX_V09${f.name}"] = f.toURI().toString()
        baseSchemaMappings["$URL_PREFIX_V08${f.name}"] = f.toURI().toString()
        baseSchemaMappings[f.name] = f.toURI().toString()
      }

    return rawList.map { caseObj ->
      val case = caseObj as Map<*, *>
      val name = case["name"] as String

      val catalogMap = case["catalog"] as Map<*, *>
      val (catalog, schemaMappings) = buildCatalog(catalogMap, conformanceDir, baseSchemaMappings)

      val validateList = case["validate"] as List<*>
      val validate =
        validateList.map { stepObj ->
          val step = stepObj as Map<*, *>
          val payloadObj = step["payload"]
          val jsonStr = jsonMapper.writeValueAsString(payloadObj)
          val payload = Json.parseToJsonElement(jsonStr)

          ValidateStep(payload = payload, expectError = step["expect_error"] as? String)
        }

      ConformanceTestCase(name, catalog, validate, schemaMappings)
    }
  }

  private fun buildCatalog(
    catalogMap: Map<*, *>,
    conformanceDir: File,
    baseSchemaMappings: Map<String, String>,
  ): Pair<A2uiCatalog, Map<String, String>> {
    val versionStr = catalogMap["version"] as String
    val version =
      if (versionStr == VERSION_0_8_STR) A2uiVersion.VERSION_0_8 else A2uiVersion.VERSION_0_9

    val s2cSchemaFile = catalogMap["s2c_schema"] as? String
    val s2cSchema =
      s2cSchemaFile?.let { loadJsonFile(File(conformanceDir, it)) } ?: JsonObject(emptyMap())

    val catalogSchemaObj = catalogMap["catalog_schema"]
    val schemaMappings = HashMap(baseSchemaMappings)

    val catalogSchema =
      if (catalogSchemaObj is String) {
        loadJsonFile(File(conformanceDir, catalogSchemaObj))
      } else if (catalogSchemaObj is Map<*, *>) {
        val jsonStr = jsonMapper.writeValueAsString(catalogSchemaObj)

        val tempFile = java.io.File.createTempFile("custom_catalog", ".json")
        tempFile.deleteOnExit()
        tempFile.writeText(jsonStr)
        schemaMappings["$URL_PREFIX_V09$SIMPLIFIED_CATALOG_V09"] =
          tempFile.toURI().toString()
        schemaMappings[SIMPLIFIED_CATALOG_V09] = tempFile.toURI().toString()

        Json.parseToJsonElement(jsonStr) as JsonObject
      } else {
        throw IllegalArgumentException("catalog_schema is required in conformance test catalog config")
      }

    val commonTypesFile = catalogMap["common_types_schema"] as? String
    val commonTypesSchema =
      commonTypesFile?.let { loadJsonFile(File(conformanceDir, it)) } ?: JsonObject(emptyMap())

    val catalog =
      A2uiCatalog(
        version = version,
        name = TEST_CATALOG_NAME,
        serverToClientSchema = s2cSchema,
        commonTypesSchema = commonTypesSchema,
        catalogSchema = catalogSchema,
      )

    return Pair(catalog, schemaMappings)
  }

  @TestFactory
  fun testValidatorConformance(): List<DynamicTest> {
    val conformanceFile = getConformanceFile(VALIDATOR_YAML_FILE)
    val conformanceDir = conformanceFile.parentFile
    val cases = parseConformanceYaml(conformanceFile, conformanceDir)

    return cases.map { case ->
      val name = case.name

      DynamicTest.dynamicTest(name) {
        val validator = A2uiValidator(case.catalog, case.schemaMappings)

        for (step in case.validate) {
          val payload = step.payload

          val expectError = step.expectError

          if (expectError != null) {
            val exception =
              assertFailsWith<IllegalArgumentException>("Expected failure for $name") {
                validator.validate(payload)
              }
            val regex = Regex(expectError)
            assertTrue(
              regex.containsMatchIn(exception.message!!) ||
                exception.message!!.contains("Validation failed") ||
                exception.message!!.contains("Invalid JSON Pointer syntax"),
              "Expected error matching '$expectError' or containing 'Validation failed', but got: ${exception.message}",
            )
          } else {
            try {
              validator.validate(payload)
            } catch (e: Exception) {
              println("Failed on valid payload for $name: ${e.message}")
              throw e
            }
          }
        }
      }
    }
  }

  private companion object {
    private val REPO_ROOT = findRepoRoot()

    private fun findRepoRoot(): File {
      var currentDir: File? = File(System.getProperty("user.dir"))
      while (currentDir != null) {
        if (File(currentDir, SPECIFICATION_DIR).isDirectory) {
          return currentDir
        }
        currentDir = currentDir.parentFile
      }
      throw IllegalStateException(
        "Could not find repository root containing specification directory."
      )
    }

    private const val SPECIFICATION_DIR = "specification"
    private const val CONFORMANCE_DIR_PATH = "agent_sdks/conformance/"
    private const val SIMPLIFIED_CATALOG_V09 = "simplified_catalog_v09.json"
    private const val URL_PREFIX_V09 = "https://a2ui.org/specification/v0_9/"
    private const val URL_PREFIX_V08 = "https://a2ui.org/specification/v0_8/"
    private const val VERSION_0_8_STR = "0.8"
    private const val TEST_CATALOG_NAME = "test_catalog"
    private const val VALIDATOR_YAML_FILE = "validator.yaml"
  }
}

private data class ConformanceTestCase(
  val name: String,
  val catalog: A2uiCatalog,
  val validate: List<ValidateStep>,
  val schemaMappings: Map<String, String>,
)

private data class ValidateStep(val payload: JsonElement, val expectError: String?)
