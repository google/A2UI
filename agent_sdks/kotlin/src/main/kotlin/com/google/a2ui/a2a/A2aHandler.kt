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

package com.google.a2ui.a2a

import com.google.a2ui.core.parser.hasA2uiParts
import com.google.a2ui.core.parser.parseResponseToParts
import com.google.adk.agents.RunConfig
import com.google.adk.runner.Runner
import com.google.adk.sessions.Session
import com.google.adk.sessions.SessionKey
import com.google.genai.types.Content
import com.google.genai.types.Part
import kotlinx.serialization.json.*

/**
 * Simplifies implementing the Agent-to-App (A2A) protocol for ADK agents without needing heavy
 * server dependencies.
 */
class A2aHandler(private val runner: Runner) {

  /** Handles the /.well-known/agent-card.json HTTP GET request. */
  fun handleAgentCardGet(
    agentName: String,
    serverUrl: String,
    supportedCatalogIds: List<String> = emptyList(),
  ): Map<String, Any> {
    return mapOf(
      "name" to agentName,
      "url" to serverUrl,
      "endpoints" to mapOf("chat" to serverUrl),
      "capabilities" to
        mapOf(
          "streaming" to true,
          "extensions" to
            listOf(
              mapOf(
                "uri" to A2uiA2a.A2UI_EXTENSION_URI,
                "params" to mapOf("supportedCatalogIds" to supportedCatalogIds),
              )
            ),
        ),
    )
  }

  /** Handles the /a2a HTTP POST JSON-RPC request. */
  @JvmOverloads
  fun handleA2aPost(
    requestBody: Map<String, Any>,
    sessionPreparer: ((Session, Map<*, *>) -> Unit)? = null,
  ): Map<String, Any> {
    val method = requestBody["method"] as? String
    val id = requestBody["id"] ?: ""
    val response = mutableMapOf<String, Any>("jsonrpc" to "2.0", "id" to id)

    try {
      if (method == "a2a.agent.card.get") {
        // Deprecated A2A JSON-RPC card get method
        response["result"] = handleAgentCardGet(runner.appName(), "/a2a")
      } else if (method == "a2a.agent.invoke" || method == "message/send") {
        val params = requestBody["params"] as? Map<*, *>
        val messageMap = params?.get("message") as? Map<*, *>

        if (messageMap == null) {
          response["error"] = mapOf("code" to -32602, "message" to "Invalid params")
          return response
        }

        // Extract context and user ID
        val contextId = messageMap["contextId"] as? String ?: DEFAULT_CONTEXT_ID
        // Actually A2A uses contextId as the session grouping. We use contextId as sessionId
        val sessionId = contextId
        val userId = A2A_USER_ID // A2A doesn't strictly provide userId natively in baseline message

        // Extract text from parts
        val partsList = messageMap["parts"] as? List<*> ?: emptyList<Any>()
        var userText = ""
        for (partItem in partsList) {
          val partMap = partItem as? Map<*, *> ?: continue
          if (partMap["kind"] == "text") {
            userText += partMap["text"] as? String ?: ""
          }
        }

        val content =
          Content.builder()
            .role("user")
            .parts(listOf(Part.builder().text(userText).build()))
            .build()

        // Ensure session exists
        var existingSession =
          runner
            .sessionService()
            .getSession(runner.appName(), userId, sessionId, java.util.Optional.empty())
            .blockingGet()
        if (existingSession == null) {
          existingSession =
            runner
              .sessionService()
              .createSession(SessionKey(runner.appName(), userId, sessionId))
              .blockingGet()
        }

        sessionPreparer?.invoke(existingSession, requestBody)

        // Pass the session object directly so changes made in sessionPreparer are visible to the
        // runner.
        val events =
          runner
            .runAsync(existingSession, content, RunConfig.builder().build())
            .toList()
            .blockingGet()

        // Translate ADK events to A2A Messages
        // Gather all textual parts returned across the ADK event stream
        val allParts =
          events.flatMap { event ->
            if (event.content().isPresent && event.content().get().parts().isPresent) {
              event.content().get().parts().get().flatMap<Part, Map<String, Any>> { part ->
                val parsedParts = mutableListOf<Map<String, Any>>()

                val functionCall = part.functionCall().orElse(null)
                if (
                  functionCall != null &&
                    functionCall.name().orElse(null) == "send_a2ui_json_to_client"
                ) {
                  val argsMap = functionCall.args().orElse(null) as? Map<*, *>
                  val a2uiJsonStr = argsMap?.get("a2ui_json") as? String
                  if (a2uiJsonStr != null) {
                    try {
                      val element = kotlinx.serialization.json.Json.parseToJsonElement(a2uiJsonStr)
                      val data = jsonElementToAny(element)
                      if (data is Map<*, *>) {
                        val dataPart =
                          mapOf(
                            "kind" to "data",
                            "metadata" to mapOf(A2uiA2a.MIME_TYPE_KEY to A2uiA2a.A2UI_MIME_TYPE),
                            "data" to data,
                          )
                        parsedParts.add(dataPart)
                      } else if (data is List<*>) {
                        // Sometimes the prompt generates a JSON array
                        val dataPart =
                          mapOf(
                            "kind" to "data",
                            "metadata" to mapOf(A2uiA2a.MIME_TYPE_KEY to A2uiA2a.A2UI_MIME_TYPE),
                            "data" to data,
                          )
                        parsedParts.add(dataPart)
                      }
                    } catch (e: Exception) {
                      // Parse error handled silently, might add error part
                    }
                  }
                }

                val text = part.text().orElse("")?.trim() ?: ""
                if (text.isEmpty()) return@flatMap parsedParts

                if (hasA2uiParts(text)) {
                  try {
                    val responseParts = parseResponseToParts(text)
                    for (responsePart in responseParts) {
                      if (responsePart.text.isNotBlank()) {
                        parsedParts.add(mapOf("kind" to "text", "text" to responsePart.text.trim()))
                      }

                      responsePart.a2uiJson?.forEach { element ->
                        val data = jsonElementToAny(element)
                        if (data != null) {
                          val dataPart =
                            mapOf(
                              "kind" to "data",
                              "metadata" to mapOf(A2uiA2a.MIME_TYPE_KEY to A2uiA2a.A2UI_MIME_TYPE),
                              "data" to data,
                            )
                          parsedParts.add(dataPart)
                        }
                      }
                    }
                    return@flatMap parsedParts
                  } catch (e: Exception) {
                    // Parse error handled silently, fallback to standard raw text propagation
                  }
                }

                parsedParts.add(mapOf("kind" to "text", "text" to text))

                parsedParts
              }
            } else {
              emptyList()
            }
          }

        // Return a single Message as per A2A JSON-RPC specification
        val finalMessage =
          mapOf(
            "messageId" to (events.lastOrNull()?.id() ?: java.util.UUID.randomUUID().toString()),
            "contextId" to contextId,
            "role" to "model",
            "kind" to "message",
            "parts" to allParts,
          )

        response["result"] = finalMessage
      } else {
        response["error"] = mapOf("code" to -32601, "message" to "Method not found")
      }
    } catch (e: Exception) {
      e.printStackTrace()
      response["error"] = mapOf("code" to -32000, "message" to (e.message ?: "Unknown error"))
    }

    return response
  }

  private fun jsonElementToAny(element: JsonElement): Any? =
    when (element) {
      is JsonObject -> element.mapValues { jsonElementToAny(it.value) }
      is JsonArray -> element.map { jsonElementToAny(it) }
      is JsonPrimitive -> {
        if (element.isString) element.content
        else if (element.booleanOrNull != null) element.booleanOrNull
        else if (element.longOrNull != null) element.longOrNull
        else if (element.doubleOrNull != null) element.doubleOrNull else null
      }
    }
}
