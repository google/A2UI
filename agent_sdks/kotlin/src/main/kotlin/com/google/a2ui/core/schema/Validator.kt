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
  fun validate(a2uiJson: JsonElement) {
    val messages = a2uiJson as? JsonArray ?: JsonArray(listOf(a2uiJson))

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
            (message[MSG_SURFACE_UPDATE] as? JsonObject)?.get(A2uiConstants.CATALOG_COMPONENTS_KEY)
              as? JsonArray
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

      val recursionValidator = A2uiRecursionValidator()
      recursionValidator.validate(message)
    }
  }

  private fun calculateSurfaceRootIds(messages: JsonArray): Map<String, String> {
    val surfaceRootIds = mutableMapOf<String, String>()
    for (message in messages) {
      if (message !is JsonObject) continue

      if (MSG_BEGIN_RENDERING in message) {
        val beginRendering = message[MSG_BEGIN_RENDERING] as? JsonObject
        val msgSurfaceId = requireNotNull(beginRendering?.get("surfaceId")?.jsonPrimitive?.content) {
          "surfaceId is required in beginRendering"
        }
        if (!surfaceRootIds.containsKey(msgSurfaceId)) {
          val rootElem = beginRendering?.get(ROOT)
          val rootId =
            when (rootElem) {
              is JsonPrimitive -> rootElem.content
              is JsonObject -> rootElem[ID]?.jsonPrimitive?.content ?: ROOT
              else -> ROOT
            }
          surfaceRootIds[msgSurfaceId] = rootId
        }
      }

      if (MSG_CREATE_SURFACE in message) {
        val createSurface = message[MSG_CREATE_SURFACE] as? JsonObject
        val msgSurfaceId = requireNotNull(createSurface?.get("surfaceId")?.jsonPrimitive?.content) {
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
      val refMap = mutableMapOf<String, Pair<Set<String>, Set<String>>>()

      val allComponents =
        catalog.catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY] as? JsonObject ?: return refMap

      // Heuristically determines if a schema property represents a single ComponentId reference.
      fun isComponentIdRef(propSchema: JsonElement): Boolean {
        if (propSchema !is JsonObject) return false
        val ref = propSchema[KEY_DOLLAR_REF]?.jsonPrimitive?.content ?: ""
        if (ref.endsWith(TITLE_COMPONENT_ID) || ref.endsWith(PROP_CHILD) || "/$PROP_CHILD" in ref)
          return true

        if (
          propSchema[PROP_TYPE]?.jsonPrimitive?.content == TYPE_STRING &&
            propSchema[PROP_TITLE]?.jsonPrimitive?.content == TITLE_COMPONENT_ID
        ) {
          return true
        }

        return listOf(COMBINATOR_ONE_OF, COMBINATOR_ANY_OF, COMBINATOR_ALL_OF).any { key ->
          (propSchema[key] as? JsonArray)?.any { isComponentIdRef(it) } == true
        }
      }

      // Heuristically determines if a schema property represents a collection of ComponentIds.
      fun isChildListRef(propSchema: JsonElement): Boolean {
        if (propSchema !is JsonObject) return false
        val ref = propSchema[KEY_DOLLAR_REF]?.jsonPrimitive?.content ?: ""
        if (
          ref.endsWith(TITLE_CHILD_LIST) || ref.endsWith(PROP_CHILDREN) || "/$PROP_CHILDREN" in ref
        )
          return true

        if (propSchema[PROP_TYPE]?.jsonPrimitive?.content == TYPE_OBJECT) {
          val props = propSchema[PROP_PROPERTIES] as? JsonObject
          if (
            props != null &&
              (PROP_EXPLICIT_LIST in props || PROP_TEMPLATE in props || PROP_COMPONENT_ID in props)
          ) {
            return true
          }
        }

        if (propSchema[PROP_TYPE]?.jsonPrimitive?.content == TYPE_ARRAY) {
          val items = propSchema[PROP_ITEMS]
          if (items != null && isComponentIdRef(items)) return true
        }

        return listOf(COMBINATOR_ONE_OF, COMBINATOR_ANY_OF, COMBINATOR_ALL_OF).any { key ->
          (propSchema[key] as? JsonArray)?.any { isChildListRef(it) } == true
        }
      }

      // Iterate over all components defined in the catalog to extract their reference fields.
      for ((compName, compSchemaElem) in allComponents) {
        val singleRefs = mutableSetOf<String>()
        val listRefs = mutableSetOf<String>()

        // Recursively inspects properties and combinators to find reference fields.
        fun extractFromProps(cs: JsonElement) {
          if (cs !is JsonObject) return
          val props = cs[PROP_PROPERTIES] as? JsonObject ?: return
          for ((propName, propSchema) in props) {
            if (
              isComponentIdRef(propSchema) ||
                propName in listOf(PROP_CHILD, PROP_CONTENT_CHILD, PROP_ENTRY_POINT_CHILD)
            ) {
              singleRefs.add(propName)
            } else if (isChildListRef(propSchema) || propName == PROP_CHILDREN) {
              listRefs.add(propName)
            }
          }

          listOf(COMBINATOR_ALL_OF, COMBINATOR_ONE_OF, COMBINATOR_ANY_OF).forEach { key ->
            (cs[key] as? JsonArray)?.forEach { extractFromProps(it) }
          }
        }

        extractFromProps(compSchemaElem)
        if (singleRefs.isNotEmpty() || listRefs.isNotEmpty()) {
          refMap[compName] = singleRefs to listRefs
        }
      }
      return refMap
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
        for ((refId, fieldName) in getComponentReferences(comp, refFieldsMap)) {
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
        val compId = comp[ID]?.jsonPrimitive?.content ?: continue

        allIds.add(compId)
        val neighbors = adjList.getOrPut(compId) { mutableListOf() }

        for ((refId, fieldName) in getComponentReferences(comp, refFieldsMap)) {
          if (refId == compId) {
            throw IllegalArgumentException(
              "Self-reference detected: Component '$compId' references itself in field '$fieldName'"
            )
          }
          neighbors.add(refId)
        }
      }

      val visited = mutableSetOf<String>()
      val recursionStack = mutableSetOf<String>()

      fun dfs(nodeId: String, depth: Int) {
        if (depth > MAX_GLOBAL_DEPTH) {
          throw IllegalArgumentException(
            "Global recursion limit exceeded: logical depth > $MAX_GLOBAL_DEPTH"
          )
        }

        visited.add(nodeId)
        recursionStack.add(nodeId)

        for (neighbor in adjList[nodeId] ?: emptyList()) {
          if (neighbor !in visited) {
            dfs(neighbor, depth + 1)
          } else if (neighbor in recursionStack) {
            throw IllegalArgumentException(
              "Circular reference detected involving component '$neighbor'"
            )
          }
        }

        recursionStack.remove(nodeId)
      }

      if (rootId != null) {
        if (rootId in allIds) dfs(rootId, 0)

        val orphans = allIds - visited
        if (orphans.isNotEmpty()) {
          val firstOrphan = orphans.sorted().first()
          throw IllegalArgumentException("Component '$firstOrphan' is not reachable from '$rootId'")
        }
      } else {
        // No root provided: traverse everything to check for cycles
        for (nodeId in allIds.sorted()) {
          if (nodeId !in visited) {
            dfs(nodeId, 0)
          }
        }
      }
    }

    private fun getComponentReferences(
      component: JsonObject,
      refFieldsMap: Map<String, Pair<Set<String>, Set<String>>>,
    ): Sequence<Pair<String, String>> = sequence {
      if (PROP_COMPONENT in component) {
        when (val compVal = component[PROP_COMPONENT]) {
          is JsonPrimitive -> {
            if (compVal.isString)
              yieldAll(getRefsRecursively(compVal.content, component, refFieldsMap))
          }
          is JsonObject -> {
            for ((cType, cProps) in compVal) {
              if (cProps is JsonObject) {
                yieldAll(getRefsRecursively(cType, cProps, refFieldsMap))
              }
            }
          }
          else -> {}
        }
      }
    }

    private fun getRefsRecursively(
      compType: String,
      props: JsonObject,
      refFieldsMap: Map<String, Pair<Set<String>, Set<String>>>,
    ): Sequence<Pair<String, String>> = sequence {
      val (singleRefs, listRefs) = refFieldsMap[compType] ?: (emptySet<String>() to emptySet())
      for ((key, value) in props) {
        val isSingle = key in singleRefs || key in HEURISTIC_SINGLE_REFS
        val isList = key in listRefs || key in HEURISTIC_LIST_REFS
        when {
          isSingle -> {
            when {
              value is JsonPrimitive && value.isString -> yield(value.content to key)
              value is JsonObject && PROP_COMPONENT_ID in value -> {
                value[PROP_COMPONENT_ID]?.jsonPrimitive?.content?.let {
                  yield(it to "$key.$PROP_COMPONENT_ID")
                }
              }
            }
          }
          isList -> {
            when (value) {
              is JsonArray -> {
                for (item in value) {
                  if (item is JsonPrimitive && item.isString) yield(item.content to key)
                }
              }
              is JsonObject -> {
                when {
                  PROP_EXPLICIT_LIST in value -> {
                    (value[PROP_EXPLICIT_LIST] as? JsonArray)?.forEach { item ->
                      if (item is JsonPrimitive && item.isString)
                        yield(item.content to "$key.$PROP_EXPLICIT_LIST")
                    }
                  }
                  PROP_TEMPLATE in value -> {
                    val template = value[PROP_TEMPLATE] as? JsonObject
                    template?.get(PROP_COMPONENT_ID)?.jsonPrimitive?.content?.let {
                      yield(it to "$key.$PROP_TEMPLATE.$PROP_COMPONENT_ID")
                    }
                  }
                  PROP_COMPONENT_ID in value -> {
                    value[PROP_COMPONENT_ID]?.jsonPrimitive?.content?.let {
                      yield(it to "$key.$PROP_COMPONENT_ID")
                    }
                  }
                }
              }
              else -> {}
            }
          }
          value is JsonArray -> {
            for ((idx, item) in value.withIndex()) {
              if (item is JsonObject) {
                item[PROP_CHILD]?.jsonPrimitive?.content?.let {
                  yield(it to "$key[$idx].$PROP_CHILD")
                }
              }
            }
          }
        }
      }
    }
  }

  /** Validates JSON payload recursion depth and functional call depth. */
  private class A2uiRecursionValidator {
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
              if (!pathElem.content.matches(JSON_POINTER_PATTERN)) {
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
    private val JSON_POINTER_PATTERN = Regex("^(?:/(?:[^~/]|~[01])*)*$")
    private const val MAX_GLOBAL_DEPTH = 50
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

    private val HEURISTIC_SINGLE_REFS =
      setOf("child", "contentChild", "entryPointChild", "detail", "summary", "root")
    private val HEURISTIC_LIST_REFS = setOf("children", "explicitList", "template")

    // JSON Schema standard keys
    private const val KEY_DOLLAR_SCHEMA = "\$schema"
    private const val KEY_DOLLAR_ID = "\$id"
    private const val KEY_DOLLAR_REF = "\$ref"
    private const val PROP_PROPERTIES = "properties"
    private const val PROP_ADDITIONAL_PROPERTIES = "additionalProperties"
    private const val PROP_TYPE = "type"
    private const val PROP_TITLE = "title"
    private const val PROP_ITEMS = "items"

    // JSON Schema combinators
    private const val COMBINATOR_ONE_OF = "oneOf"
    private const val COMBINATOR_ANY_OF = "anyOf"
    private const val COMBINATOR_ALL_OF = "allOf"

    // Types & Drafts
    private const val TYPE_STRING = "string"
    private const val TYPE_OBJECT = "object"
    private const val TYPE_ARRAY = "array"
    private const val SCHEMA_DRAFT_2020_12 = "https://json-schema.org/draft/2020-12/schema"
    private const val FILE_COMMON_TYPES = "common_types.json"

    // A2UI Component Graph Keys
    private const val PROP_COMPONENT = "component"
    private const val PROP_CHILD = "child"
    private const val PROP_CHILDREN = "children"
    private const val PROP_CONTENT_CHILD = "contentChild"
    private const val PROP_ENTRY_POINT_CHILD = "entryPointChild"
    private const val PROP_COMPONENT_ID = "componentId"
    private const val PROP_EXPLICIT_LIST = "explicitList"
    private const val PROP_TEMPLATE = "template"
    private const val TITLE_COMPONENT_ID = "ComponentId"
    private const val TITLE_CHILD_LIST = "ChildList"
  }
}
