package com.google.a2ui.core.schema

import kotlin.test.Test
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class SchemaModifiersTest {
  @Test
  fun removeStrictValidation_removesAdditionalPropertiesFalse() {
    val schema =
      Json.parseToJsonElement(
          """
            {
                "type": "object",
                "properties": {
                    "a": { "type": "string", "additionalProperties": false }
                },
                "additionalProperties": false
            }
        """
        )
        .jsonObject

    val modified = SchemaModifiers.removeStrictValidation(schema)

    assertNull(modified["additionalProperties"])
    val props = modified["properties"]!!.jsonObject
    val aSchema = props["a"]!!.jsonObject
    assertNull(aSchema["additionalProperties"])
  }

  @Test
  fun removeStrictValidation_keepsAdditionalPropertiesTrue() {
    val schema =
      Json.parseToJsonElement(
          """
            {
                "type": "object",
                "additionalProperties": true
            }
        """
        )
        .jsonObject

    val modified = SchemaModifiers.removeStrictValidation(schema)

    assertTrue(modified["additionalProperties"]!!.jsonPrimitive.booleanOrNull!!)
  }
}
