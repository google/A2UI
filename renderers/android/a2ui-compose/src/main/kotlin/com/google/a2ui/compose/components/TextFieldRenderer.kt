package com.google.a2ui.compose.components

import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.TextFieldProperties
import kotlinx.serialization.json.JsonPrimitive

@Composable
fun TextFieldRenderer(
    properties: TextFieldProperties,
    context: A2UIContext
) {
    val value = context.resolveString(properties.value)
    val label = context.resolveString(properties.label)

    OutlinedTextField(
        value = value,
        onValueChange = { newValue ->
            properties.onValueChange?.let { action ->
                 // Ideally pass newValue in action context
                 context.onUserAction(action, "textfield_needs_id", mapOf("value" to JsonPrimitive(newValue)))
            }
        },
        label = { Text(label) }
    )
}
