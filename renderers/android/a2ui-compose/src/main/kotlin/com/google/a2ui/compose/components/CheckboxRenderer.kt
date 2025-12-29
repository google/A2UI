package com.google.a2ui.compose.components

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.CheckboxProperties
import kotlinx.serialization.json.JsonPrimitive

@Composable
fun CheckboxRenderer(
    props: CheckboxProperties,
    context: A2UIContext
) {
    val checked = props.checked?.let { context.resolveBoolean(it) } ?: false
    val label = props.label?.let { context.resolveString(it) }

    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = checked,
            onCheckedChange = { isChecked ->
                props.onCheckedChange?.let { action ->
                    // In a real app we'd pass the new value in the context
                    context.onUserAction(action, "unknown_source_id", mapOf("checked" to JsonPrimitive(isChecked)))
                }
            }
        )
        if (label != null) {
            Text(text = label)
        }
    }
}
