package com.google.a2ui.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
sealed class ClientMessage {
    @Serializable
    @SerialName("userAction")
    data class UserAction(
        val name: String,
        val surfaceId: String,
        val sourceComponentId: String,
        val timestamp: String,
        val context: Map<String, JsonElement>
    ) : ClientMessage()
    
    @Serializable
    @SerialName("error")
    data class Error(
        val message: String,
        val details: String? = null
    ) : ClientMessage()
}
