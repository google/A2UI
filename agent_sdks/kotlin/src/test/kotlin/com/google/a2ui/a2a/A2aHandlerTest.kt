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

import com.google.adk.agents.RunConfig
import com.google.adk.events.Event
import com.google.adk.runner.Runner
import com.google.adk.sessions.BaseSessionService
import com.google.adk.sessions.GetSessionConfig
import com.google.adk.sessions.Session
import com.google.genai.types.Content
import com.google.genai.types.Part
import io.mockk.every
import io.mockk.mockk
import io.reactivex.rxjava3.core.Flowable
import io.reactivex.rxjava3.core.Maybe
import java.util.Optional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

@Suppress("DEPRECATION", "UNCHECKED_CAST")
class A2aHandlerTest {

  @Test
  fun handleA2aPost_replacesSmartQuotesInA2uiJson() {
    val mockRunner = mockk<Runner>(relaxed = true)
    val mockSessionService = mockk<BaseSessionService>(relaxed = true)
    val mockSession = mockk<Session>(relaxed = true)

    every { mockRunner.appName() } returns "test-app"
    every { mockRunner.sessionService() } returns mockSessionService
    every {
      mockSessionService.getSession(
        any<String>(),
        any<String>(),
        any<String>(),
        any<Optional<GetSessionConfig>>(),
      )
    } returns Maybe.just(mockSession)

    val smartQuotesJson =
      "[\n  {\n    “beginRendering”: {\n      “surfaceId”: “sales-dashboard”\n    }\n  }\n]"

    val expectedDataObj = mapOf("beginRendering" to mapOf("surfaceId" to "sales-dashboard"))

    val partText = "Here is your chart:\n<a2ui-json>\n$smartQuotesJson\n</a2ui-json>\nEnjoy!"
    val expectedNormalizedText = "Here is your chart:\n\nEnjoy!"

    val mockPart = mockk<Part>(relaxed = true)
    every { mockPart.text() } returns Optional.of(partText)
    every { mockPart.functionCall() } returns Optional.empty()

    val mockContent = mockk<Content>(relaxed = true)
    every { mockContent.parts() } returns Optional.of(listOf(mockPart))

    val mockEvent = mockk<Event>(relaxed = true)
    every { mockEvent.id() } returns "test-event-id"
    every { mockEvent.content() } returns Optional.of(mockContent)

    every {
      mockRunner.runAsync(any<com.google.adk.sessions.Session>(), any<Content>(), any<RunConfig>())
    } returns Flowable.just(mockEvent)

    val handler = A2aHandler(mockRunner)

    val requestBody =
      mapOf(
        "jsonrpc" to "2.0",
        "method" to "message/send",
        "id" to 1,
        "params" to
          mapOf(
            "message" to
              mapOf(
                "contextId" to "test-context",
                "parts" to emptyList<Any>(),
                "metadata" to
                  mapOf(
                    "a2uiClientCapabilities" to
                      mapOf(
                        "supportedCatalogIds" to
                          listOf(
                            "https://a2ui.org/specification/v0_8/standard_catalog_definition.json"
                          )
                      )
                  ),
              )
          ),
      )

    val response = handler.handleA2aPost(requestBody)

    @Suppress("UNCHECKED_CAST") val result = response["result"] as Map<String, Any>
    @Suppress("UNCHECKED_CAST") val parts = result["parts"] as List<Map<String, Any>>

    assertEquals(3, parts.size)
    assertEquals("Here is your chart:", parts[0]["text"])

    val dataPart = parts[1]
    assertEquals("data", dataPart["kind"])
    assertEquals("application/json+a2ui", (dataPart["metadata"] as Map<String, Any>)["mimeType"])
    assertEquals(expectedDataObj, dataPart["data"])

    assertEquals("Enjoy!", parts[2]["text"])
  }

  @Test
  fun handleA2aPost_passesRegularTextThrough() {
    val mockRunner = mockk<Runner>(relaxed = true)
    val mockSessionService = mockk<BaseSessionService>(relaxed = true)
    val mockSession = mockk<Session>(relaxed = true)

    every { mockRunner.appName() } returns "test-app"
    every { mockRunner.sessionService() } returns mockSessionService
    every {
      mockSessionService.getSession(
        any<String>(),
        any<String>(),
        any<String>(),
        any<Optional<GetSessionConfig>>(),
      )
    } returns Maybe.just(mockSession)

    val partText = "This is a normal conversational turn."

    val mockPart = mockk<Part>(relaxed = true)
    every { mockPart.text() } returns Optional.of(partText)
    every { mockPart.functionCall() } returns Optional.empty()

    val mockContent = mockk<Content>(relaxed = true)
    every { mockContent.parts() } returns Optional.of(listOf(mockPart))

    val mockEvent = mockk<Event>(relaxed = true)
    every { mockEvent.id() } returns "test-event-id"
    every { mockEvent.content() } returns Optional.of(mockContent)

    every {
      mockRunner.runAsync(any<com.google.adk.sessions.Session>(), any<Content>(), any<RunConfig>())
    } returns Flowable.just(mockEvent)

    val handler = A2aHandler(mockRunner)

    val requestBody =
      mapOf(
        "jsonrpc" to "2.0",
        "method" to "message/send",
        "id" to 1,
        "params" to
          mapOf(
            "message" to
              mapOf(
                "contextId" to "test-context",
                "parts" to emptyList<Any>(),
                "metadata" to
                  mapOf(
                    "a2uiClientCapabilities" to
                      mapOf(
                        "supportedCatalogIds" to
                          listOf(
                            "https://a2ui.org/specification/v0_8/standard_catalog_definition.json"
                          )
                      )
                  ),
              )
          ),
      )

    val response = handler.handleA2aPost(requestBody)

    @Suppress("UNCHECKED_CAST") val result = response["result"] as Map<String, Any>
    @Suppress("UNCHECKED_CAST") val parts = result["parts"] as List<Map<String, Any>>

    assertEquals(1, parts.size)
    assertEquals("text", parts[0]["kind"])
    assertEquals(partText, parts[0]["text"])
  }

  @Test
  fun handleA2aPost_gracefullyHandlesInvalidA2uiJson() {
    val mockRunner = mockk<Runner>(relaxed = true)
    val mockSessionService = mockk<BaseSessionService>(relaxed = true)
    val mockSession = mockk<Session>(relaxed = true)

    every { mockRunner.appName() } returns "test-app"
    every { mockRunner.sessionService() } returns mockSessionService
    every {
      mockSessionService.getSession(
        any<String>(),
        any<String>(),
        any<String>(),
        any<Optional<GetSessionConfig>>(),
      )
    } returns Maybe.just(mockSession)

    val invalidJson = "[\n  {\n    “beginRendering”: {  MISSING CLOSING BRACKETS..."

    val partText = "Here is an invalid chart:\n<a2ui-json>\n$invalidJson\n</a2ui-json>\nOops."

    val mockPart = mockk<Part>(relaxed = true)
    every { mockPart.text() } returns Optional.of(partText)
    every { mockPart.functionCall() } returns Optional.empty()

    val mockContent = mockk<Content>(relaxed = true)
    every { mockContent.parts() } returns Optional.of(listOf(mockPart))

    val mockEvent = mockk<Event>(relaxed = true)
    every { mockEvent.id() } returns "test-event-id"
    every { mockEvent.content() } returns Optional.of(mockContent)

    every {
      mockRunner.runAsync(any<com.google.adk.sessions.Session>(), any<Content>(), any<RunConfig>())
    } returns Flowable.just(mockEvent)

    val handler = A2aHandler(mockRunner)

    val requestBody =
      mapOf(
        "jsonrpc" to "2.0",
        "method" to "message/send",
        "id" to 1,
        "params" to
          mapOf(
            "message" to
              mapOf(
                "contextId" to "test-context",
                "parts" to emptyList<Any>(),
                "metadata" to
                  mapOf(
                    "a2uiClientCapabilities" to
                      mapOf(
                        "supportedCatalogIds" to
                          listOf(
                            "https://a2ui.org/specification/v0_8/standard_catalog_definition.json"
                          )
                      )
                  ),
              )
          ),
      )

    val response = handler.handleA2aPost(requestBody)

    @Suppress("UNCHECKED_CAST") val result = response["result"] as Map<String, Any>
    @Suppress("UNCHECKED_CAST") val parts = result["parts"] as List<Map<String, Any>>

    assertEquals(1, parts.size)
    assertEquals("text", parts[0]["kind"])
    assertEquals(partText, parts[0]["text"])
  }

  @Test
  fun handleA2aPost_invokesSessionPreparerWithFullRequestBody() {
    val mockRunner = mockk<Runner>(relaxed = true)
    val mockSessionService = mockk<BaseSessionService>(relaxed = true)
    val mockSession = mockk<Session>(relaxed = true)

    every { mockRunner.appName() } returns "test-app"
    every { mockRunner.sessionService() } returns mockSessionService
    every { mockSessionService.getSession(any(), any(), any(), any()) } returns
      Maybe.just(mockSession)

    val handler = A2aHandler(mockRunner)

    val requestBody =
      mapOf(
        "jsonrpc" to "2.0",
        "method" to "message/send",
        "id" to 1,
        "params" to mapOf("message" to mapOf("parts" to emptyList<Any>())),
      )
    var capturedRequestBody: Map<*, *>? = null

    handler.handleA2aPost(requestBody) { _, rb -> capturedRequestBody = rb }

    assertEquals(requestBody, capturedRequestBody)
  }
}
