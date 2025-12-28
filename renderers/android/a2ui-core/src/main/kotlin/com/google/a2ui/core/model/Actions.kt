package com.google.a2ui.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class ClientMessage {
    @Serializable
    @SerialName("userAction")
    data class UserAction(
        val name: String,
        val surfaceId: String,
        val sourceComponentId: String,
        val timestamp: String,
        val context: Map<String, Any?>
    ) : ClientMessage()
    
    @Serializable
    @SerialName("error")
    data class Error(
        val message: String,
        val details: String? = null
    ) : ClientMessage()
}
