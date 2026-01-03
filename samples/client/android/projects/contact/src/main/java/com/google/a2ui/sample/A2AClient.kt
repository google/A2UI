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
import java.util.concurrent.TimeUnit

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
// Response models from the A2A agent (Simplified for what we need)
@Serializable
data class A2AResult(
    val kind: String? = null, // "task"
    val status: A2ATaskStatus? = null,
    val error: A2AError? = null // In case error is inside result
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
data class ServerPart(
    val data: JsonElement? = null,
    val text: String? = null
)


// --- JSON-RPC Wrapper Models ---
@Serializable
data class JsonRpcRequest(
    val jsonrpc: String = "2.0",
    val method: String,
    val params: A2AClientMessage,
    val id: String
)

@Serializable
data class JsonRpcResponse(
    val jsonrpc: String,
    val result: A2AResult? = null,
    val error: JsonRpcError? = null,
    val id: String
)

@Serializable
data class JsonRpcError(
    val code: Int,
    val message: String,
    val data: JsonElement? = null
)



class A2AClient(
    private val agentUrl: String = "http://10.0.2.2:10003/" // Default to local agent root
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(90, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS)
        .writeTimeout(90, TimeUnit.SECONDS)
        .build()
    private val json = Json { 
        ignoreUnknownKeys = true 
        classDiscriminator = "kind" // For sealed classes
        encodeDefaults = true
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
        val messageId = UUID.randomUUID().toString()
        val envelope = A2AClientMessage(
            message = ClientMessageEnvelope(
                messageId = messageId,
                parts = listOf(part)
            )
        )

        // Wrap in JSON-RPC
        val rpcRequest = JsonRpcRequest(
            method = "message/send",
            params = envelope,
            id = messageId
        )

        val requestBody = json.encodeToString(rpcRequest).toRequestBody(mediaType)

        // Log the request body for debugging
        // android.util.Log.d("A2AClient", "Request: ${json.encodeToString(rpcRequest)}")

        val request = Request.Builder()
            .url(agentUrl)
            .addHeader("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8") // Crucial!
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")

            val responseBody = response.body?.string() ?: throw IOException("Empty response body")
            android.util.Log.d("A2AClient", "Raw Response: $responseBody")
            
            // Decode JSON-RPC response
            val rpcResponse = try {
                 json.decodeFromString<JsonRpcResponse>(responseBody)
            } catch (e: Exception) {
                throw IOException("Failed to parse JSON-RPC response: ${e.message}. Body: $responseBody")
            }

            if (rpcResponse.error != null) {
                throw IOException("JSON-RPC Error ${rpcResponse.error.code}: ${rpcResponse.error.message}")
            }

            val a2aResult = rpcResponse.result ?: throw IOException("Empty results in JSON-RPC response")

            if (a2aResult.error != null) {
                throw IOException("Agent Error: ${a2aResult.error.message}")
            }

            // If the status is "done", there might be no message. Access safely.
            val parts = a2aResult.status?.message?.parts ?: emptyList()
            
            // Extract only the A2UI updates
            val uiParts = parts.mapNotNull { part ->
                if (part.data != null) {
                    val jsonElement = part.data
                    if (jsonElement is JsonObject) {
                        try {
                            when {
                                "beginRendering" in jsonElement -> json.decodeFromJsonElement(ServerMessage.BeginRendering.serializer(), jsonElement["beginRendering"]!!)
                                "surfaceUpdate" in jsonElement -> json.decodeFromJsonElement(ServerMessage.SurfaceUpdate.serializer(), jsonElement["surfaceUpdate"]!!)
                                "dataModelUpdate" in jsonElement -> json.decodeFromJsonElement(ServerMessage.DataModelUpdate.serializer(), jsonElement["dataModelUpdate"]!!)
                                "deleteSurface" in jsonElement -> json.decodeFromJsonElement(ServerMessage.DeleteSurface.serializer(), jsonElement["deleteSurface"]!!)
                                else -> null
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("A2AClient", "Failed to decode message part: ${e.message}")
                            null
                        }
                    } else null
                } else null 
            }

            android.util.Log.d("A2AClient", "Received ${uiParts.size} UI parts out of ${parts.size} total parts.")
            uiParts.forEachIndexed { index, part ->
                 android.util.Log.d("A2AClient", "UI Part $index: $part")
            }

            return uiParts
        }
    }
}
