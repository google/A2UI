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
import com.google.adk.a2a.converters.EventConverter
import com.google.adk.agents.InvocationContext
import com.google.adk.events.Event
import com.google.adk.sessions.Session
import com.google.common.collect.ImmutableList
import com.google.genai.types.Content
import com.google.genai.types.FinishReason
import com.google.genai.types.Part
import io.a2a.spec.TaskState
import io.a2a.spec.TaskStatusUpdateEvent
import io.a2a.spec.TextPart
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import java.util.Optional
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class A2uiEventConverterTest {

  @Test
  fun `emits FAILED TaskStatusUpdateEvent when event has errorCode`() {
    val session = mockk<Session>()
    every { session.state() } returns
      java.util.concurrent.ConcurrentHashMap<String, Any>(
        mapOf("system:a2ui_catalog" to mockk<A2uiCatalog>())
      )

    val context = mockk<InvocationContext>()
    every { context.session() } returns session

    val mockEvent = mockk<Event>()
    val finishReasonArg = mockk<FinishReason>()
    every { mockEvent.errorCode() } returns Optional.of(finishReasonArg)
    every { mockEvent.errorMessage() } returns Optional.of("Server crash")
    every { mockEvent.content() } returns Optional.empty()
    every { mockEvent.author() } returns "test_author"

    mockkStatic(EventConverter::class)
    every { EventConverter.taskId(mockEvent) } returns "task-1"
    every { EventConverter.contextId(mockEvent) } returns "context-1"

    val converter = A2uiEventConverter()
    val results = converter.convert(mockEvent, context)

    assertEquals(1, results.size)
    val result = results[0]
    assertIs<TaskStatusUpdateEvent>(result)

    assertEquals("task-1", result.taskId())
    assertEquals("context-1", result.contextId())
    assertEquals(TaskState.TASK_STATE_FAILED, result.status().state())

    val msg = result.status().message()!!
    assertEquals(1, msg.parts()!!.size)
    val part = msg.parts()!![0] as TextPart
    assertEquals("Server crash", part.text())
  }

  @Test
  fun `emits WORKING TaskStatusUpdateEvent when event has standard content`() {
    val catalog = mockk<A2uiCatalog>()
    val session = mockk<Session>()
    every { session.state() } returns
      java.util.concurrent.ConcurrentHashMap<String, Any>(mapOf("system:a2ui_catalog" to catalog))

    val context = mockk<InvocationContext>()
    every { context.session() } returns session

    // Using Mockk for GenAI Content and Part
    val mockGenaiPart = mockk<Part>()
    every { mockGenaiPart.functionResponse() } returns Optional.empty()
    every { mockGenaiPart.functionCall() } returns Optional.empty()
    every { mockGenaiPart.text() } returns Optional.of("Regular text response")

    val mockContent = mockk<Content>()
    every { mockContent.parts() } returns Optional.of(listOf(mockGenaiPart))

    val mockEvent = mockk<Event>()
    every { mockEvent.errorCode() } returns Optional.empty()
    every { mockEvent.content() } returns Optional.of(mockContent)
    every { mockEvent.author() } returns "test_author"

    mockkStatic(EventConverter::class)
    // mock behavior of fallback standard conversion
    every { EventConverter.contentToParts(any(), false) } returns
      ImmutableList.of(TextPart("Regular text response"))

    every { EventConverter.taskId(mockEvent) } returns "task-123"
    every { EventConverter.contextId(mockEvent) } returns "context-123"

    val converter = A2uiEventConverter()
    val results = converter.convert(mockEvent, context)

    assertEquals(1, results.size)
    val result = results[0]
    assertIs<TaskStatusUpdateEvent>(result)

    assertEquals("task-123", result.taskId())
    assertEquals("context-123", result.contextId())
    assertEquals(TaskState.TASK_STATE_WORKING, result.status().state())

    val msg = result.status().message()!!
    assertTrue(msg.parts()!!.isNotEmpty())
    val part = msg.parts()!![0] as TextPart
    assertEquals("Regular text response", part.text())
  }

  @Test
  fun `returns empty list when catalog is missing from session state`() {
    val session = mockk<Session>()
    every { session.state() } returns
      java.util.concurrent.ConcurrentHashMap<String, Any>() // No catalog!

    val context = mockk<InvocationContext>()
    every { context.session() } returns session

    val event = mockk<Event>()

    val converter = A2uiEventConverter()
    val results = converter.convert(event, context)

    assertTrue(results.isEmpty())
  }
}
