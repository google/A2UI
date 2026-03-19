package com.google.a2ui.core.schema

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull

/** Standard transformations for A2UI schemas. */
object SchemaModifiers {
  /**
   * Recursively removes "additionalProperties: false" constraints from a JSON schema.
   *
   * This is useful when the agent might generate slightly different properties than defined in a
   * strict schema, allowing for more flexible LLM output.
   */
  fun removeStrictValidation(schema: JsonObject): JsonObject =
    recursiveRemoveStrict(schema) as JsonObject

  private fun recursiveRemoveStrict(element: JsonElement): JsonElement =
    when (element) {
      is JsonObject -> {
        val filtered =
          element.filter { (key, value) ->
            key != "additionalProperties" || (value as? JsonPrimitive)?.booleanOrNull != false
          }
        JsonObject(filtered.mapValues { recursiveRemoveStrict(it.value) })
      }
      is JsonArray -> JsonArray(element.map { recursiveRemoveStrict(it) })
      else -> element
    }
}
