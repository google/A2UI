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

package com.google.a2ui.adk.a2a_extension

import com.google.a2ui.core.schema.A2uiCatalog
import com.google.a2ui.core.schema.A2uiVersion
import com.google.adk.agents.ReadonlyContext
import com.google.adk.tools.ToolContext
import io.mockk.mockk
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class SendA2uiToClientToolsetTest {

  private val catalogSchema =
    Json.parseToJsonElement(
        """
        {
          "catalogId": "dummy",
          "components": {
            "TestComp": {"type": "object"}
          }
        }
    """
      )
      .jsonObject as JsonObject

  // Minimal permissive serverToClient schema for testing
  private val serverToClientSchema =
    Json.parseToJsonElement(
        """
        {
           "type": "object",
           "properties": {
              "beginRendering": {"type": "object", "properties": {"root": {"type": "object"}}}
           }
        }
    """
      )
      .jsonObject as JsonObject

  private val dummyCatalog =
    A2uiCatalog(
      version = A2uiVersion.VERSION_0_9,
      name = "dummy",
      serverToClientSchema = serverToClientSchema,
      commonTypesSchema = JsonObject(emptyMap()),
      catalogSchema = catalogSchema,
    )

  private val mockContext = mockk<ReadonlyContext>(relaxed = true)
  private val mockToolContext = mockk<ToolContext>(relaxed = true)

  // Removed testsNameAndDescription because BaseTool properties are protected/private in ADK

  @Test
  fun execute_validPayload_emitsPayload() {
    val toolset = SendA2uiToClientToolset.create(true, dummyCatalog, "")
    val tool = toolset.getTools(mockContext).blockingFirst()

    val a2uiJsonStr = """{"beginRendering": {"root": {"component": "TestComp", "id": "1"}}}"""

    val args = mapOf("a2ui_json" to a2uiJsonStr)
    val result = tool.runAsync(args, mockToolContext).blockingGet()

    assertNotNull(result[SendA2uiToClientToolset.VALIDATED_A2UI_JSON_KEY])
    val validatedPayload =
      result[SendA2uiToClientToolset.VALIDATED_A2UI_JSON_KEY]
        as kotlinx.serialization.json.JsonElement

    assertTrue(validatedPayload.toString().contains("beginRendering"))
    assertTrue(validatedPayload.toString().contains("TestComp"))
  }

  @Test
  fun execute_invalidPayload_rejectsPayload() {
    val toolset = SendA2uiToClientToolset.create(true, dummyCatalog, "")
    val tool = toolset.getTools(mockContext).blockingFirst()

    // Missing a2ui_json argument entirely
    val args = mapOf<String, Any>("wrong_arg" to "b")
    val result = tool.runAsync(args, mockToolContext).blockingGet()

    assertNotNull(result[SendA2uiToClientToolset.TOOL_ERROR_KEY])
    val errorMsg = result[SendA2uiToClientToolset.TOOL_ERROR_KEY] as String
    assertTrue(errorMsg.contains("missing required arg a2ui_json"))
  }
}
