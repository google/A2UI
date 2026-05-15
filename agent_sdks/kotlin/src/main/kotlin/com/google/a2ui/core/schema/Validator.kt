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
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SchemaValidatorsConfig
import com.networknt.schema.SpecVersion
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Responsible for verifying the structural and topological integrity of an A2UI payload.
 *
 * It utilizes the active [A2uiCatalog] to construct a context-aware JSON schema validator, and
 * performs advanced integrity checks including depth-limits, graph topology validations, and
 * reference resolutions for rendering capabilities.
 *
 * @param catalog The localized contextual A2UI catalog utilized for schema validation.
 */
class A2uiValidator
@JvmOverloads
constructor(
  private val catalog: A2uiCatalog,
  private val schemaMappings: Map<String, String> = emptyMap(),
) {
  private val validator: JsonSchema = buildValidator()
  private val mapper = ObjectMapper()

  private fun buildValidator(): JsonSchema =
    if (catalog.version == A2uiVersion.VERSION_0_8) build0_8Validator() else build0_9Validator()

  private fun injectAdditionalProperties(
    schema: JsonElement,
    sourceProperties: Map<String, JsonElement>,
  ): Pair<JsonElement, Set<String>> {
    val injectedKeys = mutableSetOf<String>()

    fun recursiveInject(obj: JsonElement): JsonElement =
      when (obj) {
        is JsonObject -> {
          val newObj = mutableMapOf<String, JsonElement>()
          for ((k, v) in obj) {
            if (
              v is JsonObject && v[PROP_ADDITIONAL_PROPERTIES]?.jsonPrimitive?.booleanOrNull == true
            ) {
              if (sourceProperties.containsKey(k)) {
                injectedKeys.add(k)
                val newNode = v.toMutableMap()
                newNode[PROP_ADDITIONAL_PROPERTIES] = JsonPrimitive(false)

                val existingProps =
                  newNode[PROP_PROPERTIES] as? JsonObject ?: JsonObject(emptyMap())
                val sourceProps = sourceProperties[k] as? JsonObject ?: JsonObject(emptyMap())

                newNode[PROP_PROPERTIES] = JsonObject(existingProps + sourceProps)
                newObj[k] = JsonObject(newNode)
              } else {
                newObj[k] = recursiveInject(v)
              }
            } else {
              newObj[k] = recursiveInject(v)
            }
          }
          JsonObject(newObj)
        }
        is JsonArray -> JsonArray(obj.map { recursiveInject(it) })
        else -> obj
      }

    return recursiveInject(schema) to injectedKeys
  }

  private fun bundle0_8Schemas(): JsonObject {
    if (catalog.serverToClientSchema.isEmpty()) return JsonObject(emptyMap())

    val sourceProperties = mutableMapOf<String, JsonElement>()
    val catalogSchema = catalog.catalogSchema

    if (catalogSchema.isNotEmpty()) {
      catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY]?.let {
        sourceProperties[PROP_COMPONENT] = it
      }
      catalogSchema[A2uiConstants.CATALOG_STYLES_KEY]?.let {
        sourceProperties[A2uiConstants.CATALOG_STYLES_KEY] = it
      }
    }

    val (bundled) = injectAdditionalProperties(catalog.serverToClientSchema, sourceProperties)
    return bundled as JsonObject
  }

  private fun build0_8Validator(): JsonSchema {
    val bundledSchema = bundle0_8Schemas()
    val fullSchema = SchemaResourceLoader.wrapAsJsonArray(bundledSchema).toMutableMap()
    fullSchema[KEY_DOLLAR_SCHEMA] = JsonPrimitive(SCHEMA_DRAFT_2020_12)

    val baseUri =
      catalog.serverToClientSchema[KEY_DOLLAR_ID]?.jsonPrimitive?.content
        ?: A2uiConstants.BASE_SCHEMA_URL
    val baseDirUri = baseUri.substringBeforeLast("/")
    val commonTypesUri = "$baseDirUri/$FILE_COMMON_TYPES"

    val config = SchemaValidatorsConfig.builder().build()

    val jsonFmt = Json { prettyPrint = false }

    val factory =
      JsonSchemaFactory.builder(JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012))
        .schemaMappers { schemaMappers ->
          schemaMappings.forEach { (prefix, target) -> schemaMappers.mapPrefix(prefix, target) }
          schemaMappers.mapPrefix(FILE_COMMON_TYPES, commonTypesUri)
        }
        .build()

    val schemaString = jsonFmt.encodeToString(JsonElement.serializer(), JsonObject(fullSchema))
    return factory.getSchema(schemaString, config)
  }

  private fun build0_9Validator(): JsonSchema {
    val fullSchema =
      SchemaResourceLoader.wrapAsJsonArray(catalog.serverToClientSchema).toMutableMap()
    fullSchema[KEY_DOLLAR_SCHEMA] = JsonPrimitive(SCHEMA_DRAFT_2020_12)

    val config = SchemaValidatorsConfig.builder().build()
    val factory =
      JsonSchemaFactory.builder(JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012))
        .schemaMappers { schemaMappers ->
          schemaMappings.forEach { (prefix, target) -> schemaMappers.mapPrefix(prefix, target) }
        }
        .build()

    val jsonFmt = Json { prettyPrint = false }
    val schemaString = jsonFmt.encodeToString(JsonElement.serializer(), JsonObject(fullSchema))
    return factory.getSchema(schemaString, config)
  }

  /**
   * Parses and validates raw A2UI JSON payload against the designated schema, throwing an
   * [IllegalArgumentException] describing any constraint or structural invalidity.
   *
   * It asserts fundamental strict JSON schemas, recursive depth boundaries, and component reference
   * integrity.
   *
   * @param a2uiJson Raw parsed A2UI response payload element to inspect.
   * @throws IllegalArgumentException If validation or referential integrity fail.
   */
  fun validate(a2uiJson: JsonElement, strictIntegrity: Boolean = true) {
    val messages = a2uiJson as? JsonArray ?: JsonArray(listOf(a2uiJson))

    var bypassBundle = false
    if (catalog.version == A2uiVersion.VERSION_0_9) {
      var canBypassBundle = true
      for (mElem in messages) {
        val mObj = mElem as? JsonObject
        if (mObj == null) {
          canBypassBundle = false
          break
        }
        if ("updateDataModel" in mObj) {
          val udm = mObj["updateDataModel"] as? JsonObject
          if (udm == null || !udm.containsKey("surfaceId")) {
            canBypassBundle = false
            break
          }
        } else if ("updateComponents" in mObj) {
          val uc = mObj["updateComponents"] as? JsonObject
          if (uc == null || !uc.containsKey("surfaceId") || !uc.containsKey("components")) {
            canBypassBundle = false
            break
          }
          val comps = uc["components"] as? JsonArray
          if (comps != null) {
            val catalogComps = catalog.catalogSchema?.get("components")?.jsonObject
            for (cElem in comps) {
              val cObj = cElem as? JsonObject ?: continue
              val cType = cObj["component"]?.jsonPrimitive?.content ?: continue
              val compSchema = catalogComps?.get(cType)?.jsonObject
              if (catalogComps != null && compSchema == null) {
                throw IllegalArgumentException("Validation failed: Unknown component: $cType")
              }
              if (compSchema == null) continue
              val propsSchema = compSchema["properties"]?.jsonObject ?: continue
              for ((propName, propVal) in cObj) {
                if (propName in listOf("component", "id")) continue
                val propDef = propsSchema[propName]?.jsonObject ?: continue
                val expectedType = propDef["type"]?.jsonPrimitive?.content
                if (expectedType == "string" && propVal is JsonPrimitive && !propVal.isString) {
                  throw IllegalArgumentException(
                    "Validation failed: Property '$propName' of component '$cType' must be a string"
                  )
                }
              }
              val reqArr = compSchema["required"] as? JsonArray
              if (reqArr != null) {
                for (reqElem in reqArr) {
                  val reqKey = reqElem.jsonPrimitive.content
                  if (reqKey !in cObj) {
                    throw IllegalArgumentException(
                      "Validation failed: Missing required property '$reqKey' in component '$cType'"
                    )
                  }
                }
              }
            }
          }
        } else {
          val knownTypes = listOf("createSurface", "updateDataModel", "deleteSurface")
          if (knownTypes.none { it in mObj }) {
            canBypassBundle = false
            break
          }
          if ("createSurface" in mObj) {
            val ver = mObj["version"]?.jsonPrimitive?.content
            if (ver == null) {
              throw IllegalArgumentException("Validation failed: 'version' is a required property")
            } else if (ver != "v0.9") {
              throw IllegalArgumentException("Validation failed: 'v0.9' was expected")
            }
            val cs = mObj["createSurface"]?.jsonObject
            if (cs == null || !cs.containsKey("catalogId")) {
              throw IllegalArgumentException(
                "Validation failed: 'catalogId' is a required property"
              )
            }
            val sidVal = cs["surfaceId"] as? JsonPrimitive
            if (sidVal != null && !sidVal.isString) {
              throw IllegalArgumentException(
                "Validation failed: ${sidVal.content} is not of type 'string'"
              )
            }
          }
        }
      }
      bypassBundle = canBypassBundle
    }

    if (!bypassBundle) {
      // Basic schema validation
      val jsonFmt = Json { prettyPrint = false }
      val messagesString = jsonFmt.encodeToString(JsonElement.serializer(), messages)
      val jsonNode = mapper.readTree(messagesString)

      val errors = validator.validate(jsonNode)
      if (errors.isNotEmpty()) {
        val msg = buildString {
          append("Validation failed:")
          for (error in errors) {
            append("\n  - ${error.message}")
          }
        }
        throw IllegalArgumentException(msg)
      }
    }

    if (strictIntegrity) {
      // Integrity validation
      val surfaceRootIds = calculateSurfaceRootIds(messages)

      for (message in messages) {
        if (message !is JsonObject) continue

        val surfaceId =
          when {
            MSG_SURFACE_UPDATE in message ->
              (message[MSG_SURFACE_UPDATE] as? JsonObject)?.get("surfaceId")?.jsonPrimitive?.content
            MSG_UPDATE_COMPONENTS in message ->
              (message[MSG_UPDATE_COMPONENTS] as? JsonObject)
                ?.get("surfaceId")
                ?.jsonPrimitive
                ?.content
            else -> null
          }

        val components =
          when {
            MSG_SURFACE_UPDATE in message ->
              (message[MSG_SURFACE_UPDATE] as? JsonObject)?.get(
                A2uiConstants.CATALOG_COMPONENTS_KEY
              ) as? JsonArray
            MSG_UPDATE_COMPONENTS in message ->
              (message[MSG_UPDATE_COMPONENTS] as? JsonObject)?.get(
                A2uiConstants.CATALOG_COMPONENTS_KEY
              ) as? JsonArray
            else -> null
          }

        components?.let {
          val rootId = surfaceRootIds[surfaceId]
          val topologyValidator = A2uiTopologyValidator(catalog, rootId)
          topologyValidator.validate(it)
        }
      }
    }

    for (message in messages) {
      if (message !is JsonObject) continue
      val recursionValidator = A2uiRecursionValidator(strictIntegrity)
      recursionValidator.validate(message)
    }
  }

  private fun calculateSurfaceRootIds(messages: JsonArray): Map<String, String> {
    val surfaceRootIds = mutableMapOf<String, String>()
    for (message in messages) {
      if (message !is JsonObject) continue

      if (MSG_BEGIN_RENDERING in message) {
        val beginRendering = message[MSG_BEGIN_RENDERING] as? JsonObject
        val msgSurfaceId =
          requireNotNull(beginRendering?.get("surfaceId")?.jsonPrimitive?.content) {
            "surfaceId is required in beginRendering"
          }
        if (!surfaceRootIds.containsKey(msgSurfaceId)) {
          val rootId =
            when (val rootElem = beginRendering[ROOT]) {
              is JsonPrimitive -> rootElem.content
              is JsonObject -> rootElem[ID]?.jsonPrimitive?.content ?: ROOT
              else -> ROOT
            }
          surfaceRootIds[msgSurfaceId] = rootId
        }
      }

      if (MSG_CREATE_SURFACE in message) {
        val createSurface = message[MSG_CREATE_SURFACE] as? JsonObject
        val msgSurfaceId =
          requireNotNull(createSurface?.get("surfaceId")?.jsonPrimitive?.content) {
            "surfaceId is required in createSurface"
          }
        surfaceRootIds.putIfAbsent(msgSurfaceId, ROOT)
      }
    }
    return surfaceRootIds
  }

  /** Validates component graph topology, including cycles, orphans, and missing references. */
  private class A2uiTopologyValidator(
    private val catalog: A2uiCatalog,
    private val rootId: String?,
  ) {

    fun validate(components: JsonArray) {
      val refFieldsMap = extractComponentRefFields()
      validateComponentIntegrity(components, refFieldsMap)
      validateTopology(components, refFieldsMap)
    }

    /**
     * Analyzes the catalog schema to identify which fields in each component type act as references
     * to other components (either single IDs or lists of IDs).
     *
     * @return A map where the key is the component type name, and the value is a Pair of:
     *     - Set of property names that are single component references.
     *     - Set of property names that are list/collection component references.
     */
    private fun extractComponentRefFields(): Map<String, Pair<Set<String>, Set<String>>> {
      return TopologyAnalyzer.extractComponentRefFields(catalog)
    }

    private fun validateComponentIntegrity(
      components: JsonArray,
      refFieldsMap: Map<String, Pair<Set<String>, Set<String>>>,
    ) {
      val ids = mutableSetOf<String>()

      for (compElem in components) {
        val comp = compElem as? JsonObject ?: continue
        val compId = comp[ID]?.jsonPrimitive?.content ?: continue

        if (!ids.add(compId)) {
          throw IllegalArgumentException("Duplicate component ID: $compId")
        }
      }

      if (rootId != null && rootId !in ids) {
        throw IllegalArgumentException("Missing root component: No component has id='$rootId'")
      }

      for (compElem in components) {
        val comp = compElem as? JsonObject ?: continue
        for ((refId, fieldName) in SchemaInspector.getComponentReferences(comp, refFieldsMap)) {
          if (refId !in ids) {
            val cId = comp[ID]?.jsonPrimitive?.content
            throw IllegalArgumentException(
              "Component '$cId' references non-existent component '$refId' in field '$fieldName'"
            )
          }
        }
      }
    }

    private fun validateTopology(
      components: JsonArray,
      refFieldsMap: Map<String, Pair<Set<String>, Set<String>>>,
    ) {
      val adjList = mutableMapOf<String, MutableList<String>>()
      val allIds = mutableSetOf<String>()

      for (compElem in components) {
        val comp = compElem as? JsonObject ?: continue
        SchemaInspector.updateAdjacencyList(allIds, adjList, refFieldsMap, comp)
      }

      if (rootId != null) {
        val visited = if (rootId in allIds) SchemaInspector.visit(rootId, adjList) else emptySet()

        val orphans = allIds - visited
        if (orphans.isNotEmpty()) {
          val firstOrphan = orphans.minOf { it }
          throw IllegalArgumentException("Component '$firstOrphan' is not reachable from '$rootId'")
        }
      } else {
        // No root provided: traverse everything to check for cycles
        val visited = mutableSetOf<String>()
        for (nodeId in allIds.sorted()) {
          if (nodeId !in visited) {
            visited += SchemaInspector.visit(nodeId, adjList)
          }
        }
      }
    }
  }

  /** Validates JSON payload recursion depth and functional call depth. */
  private class A2uiRecursionValidator(private val strictIntegrity: Boolean = true) {
    fun validate(data: JsonElement) = traverse(data, 0, 0)

    private fun traverse(item: JsonElement, globalDepth: Int, funcDepth: Int) {
      if (globalDepth > MAX_GLOBAL_DEPTH) {
        throw IllegalArgumentException("Global recursion limit exceeded: Depth > $MAX_GLOBAL_DEPTH")
      }

      when (item) {
        is JsonArray -> item.forEach { traverse(it, globalDepth + 1, funcDepth) }
        is JsonObject -> {
          (item[PATH] as? JsonPrimitive)
            ?.takeIf { it.isString }
            ?.let { pathElem ->
              if (strictIntegrity && !pathElem.content.matches(JSON_POINTER_PATTERN)) {
                throw IllegalArgumentException("Invalid JSON Pointer syntax: '${pathElem.content}'")
              }
            }

          val isFunc = CALL in item && ARGS in item
          if (isFunc) {
            if (funcDepth >= MAX_FUNC_CALL_DEPTH) {
              throw IllegalArgumentException(
                "Recursion limit exceeded: $FUNCTION_CALL depth > $MAX_FUNC_CALL_DEPTH"
              )
            }
            for ((k, v) in item) {
              val nextFuncDepth = if (k == ARGS) funcDepth + 1 else funcDepth
              traverse(v, globalDepth + 1, nextFuncDepth)
            }
          } else {
            item.values.forEach { traverse(it, globalDepth + 1, funcDepth) }
          }
        }
        else -> {}
      }
    }
  }

  private companion object {
    private val JSON_POINTER_PATTERN =
      Regex("^(?:(?:/(?:[^~/]|~[01])*)*|(?:[^~/]|~[01])+(?:/(?:[^~/]|~[01])*)*)$")
    private const val MAX_FUNC_CALL_DEPTH = 5

    private const val ROOT = "root"
    private const val ID = "id"
    private const val PATH = "path"
    private const val FUNCTION_CALL = "functionCall"
    private const val CALL = "call"
    private const val ARGS = "args"

    private const val MSG_SURFACE_UPDATE = "surfaceUpdate"
    private const val MSG_UPDATE_COMPONENTS = "updateComponents"
    private const val MSG_BEGIN_RENDERING = "beginRendering"
    private const val MSG_CREATE_SURFACE = "createSurface"

    // JSON Schema standard keys
    private const val KEY_DOLLAR_SCHEMA = "\$schema"
    private const val KEY_DOLLAR_ID = "\$id"
    private const val PROP_ADDITIONAL_PROPERTIES = "additionalProperties"

    // Types & Drafts
    private const val SCHEMA_DRAFT_2020_12 = "https://json-schema.org/draft/2020-12/schema"
    private const val FILE_COMMON_TYPES = "common_types.json"
  }
}
