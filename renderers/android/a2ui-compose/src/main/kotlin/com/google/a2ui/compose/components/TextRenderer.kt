package com.google.a2ui.compose.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.TextProperties

@Composable
fun TextRenderer(
    properties: TextProperties,
    context: A2UIContext
) {
    val text = context.resolveString(properties.text)
    val style = when (properties.usageHint) {
        "h1", "displayLarge" -> MaterialTheme.typography.displayLarge
        "h2", "headlineLarge" -> MaterialTheme.typography.headlineLarge
        "h3", "titleLarge" -> MaterialTheme.typography.titleLarge
        "body", "bodyMedium" -> MaterialTheme.typography.bodyMedium
        "caption", "labelSmall" -> MaterialTheme.typography.labelSmall
        else -> MaterialTheme.typography.bodyMedium
    }

    Text(
        text = text,
        style = style
    )
}
