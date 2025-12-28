package com.google.a2ui.sample

import com.google.a2ui.core.model.ServerMessage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.UUID

// --- A2A Protocol Data Models ---

@Serializable
data class A2AClientMessage(
    val message: ClientMessageEnvelope
)

@Serializable
data class ClientMessageEnvelope(
    val messageId: String,
    val role: String = "user",
    val parts: List<ClientPart>,
    val kind: String = "message"
)

@Serializable
sealed class ClientPart {
    @Serializable
    @SerialName("text")
    data class Text(val text: String) : ClientPart()

    @Serializable
    @SerialName("data")
    data class Data(
        val data: JsonElement,
        val metadata: Map<String, String> = mapOf("mimeType" to "application/json+a2aui")
    ) : ClientPart()
}

// Response models from the A2A agent (Simplified for what we need)
@Serializable
data class A2AResponse(
    val result: A2AResult? = null,
    val error: A2AError? = null
)

@Serializable
data class A2AResult(
    val kind: String, // "task"
    val status: A2ATaskStatus
)

@Serializable
data class A2AError(
    val message: String
)

@Serializable
data class A2ATaskStatus(
    val message: ServerMessageEnvelope? = null
)

@Serializable
data class ServerMessageEnvelope(
    val parts: List<ServerPart>? = null
)

@Serializable
sealed class ServerPart {
    // We only care about data parts for A2UI updates
    @Serializable
    @SerialName("data")
    data class Data(val data: ServerMessage) : ServerPart() // ServerMessage is from a2ui-core

    @Serializable
    @SerialName("text")
    data class Text(val text: String) : ServerPart()
}


class A2AClient(
    private val agentUrl: String = "http://10.0.2.2:10003/a2a" // Default to local agent
) {
    private val client = OkHttpClient()
    private val json = Json { 
        ignoreUnknownKeys = true 
        classDiscriminator = "kind" // For sealed classes
    }

    private val mediaType = "application/json; charset=utf-8".toMediaType()

    @Throws(IOException::class)
    fun sendMessage(text: String): List<ServerMessage> {
        val part = ClientPart.Text(text)
        return sendInternal(part)
    }

    @Throws(IOException::class)
    fun sendEvent(eventData: JsonElement): List<ServerMessage> {
        val part = ClientPart.Data(eventData)
        return sendInternal(part)
    }

    private fun sendInternal(part: ClientPart): List<ServerMessage> {
        val envelope = A2AClientMessage(
            message = ClientMessageEnvelope(
                messageId = UUID.randomUUID().toString(),
                parts = listOf(part)
            )
        )

        val requestBody = json.encodeToString(envelope).toRequestBody(mediaType)

        val request = Request.Builder()
            .url(agentUrl)
            .addHeader("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8") // Crucial!
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")

            val responseBody = response.body?.string() ?: throw IOException("Empty response body")
            
            // The agent might return a direct error or a Task object
            // We'll attempt to parse the Task object first
            val a2aResponse = try {
                 json.decodeFromString<A2AResponse>(responseBody)
            } catch (e: Exception) {
                // If it fails, it might be a raw list or something entirely different
                throw IOException("Failed to parse A2A response: ${e.message}. Response: $responseBody")
            }

            if (a2aResponse.error != null) {
                throw IOException("Agent Error: ${a2aResponse.error.message}")
            }

            val parts = a2aResponse.result?.status?.message?.parts ?: emptyList()
            
            // Extract only the A2UI updates
            return parts.mapNotNull { 
                if (it is ServerPart.Data) it.data else null 
            }
        }
    }
}
