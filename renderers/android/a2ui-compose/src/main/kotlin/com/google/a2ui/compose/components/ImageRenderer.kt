package com.google.a2ui.compose.components

import androidx.compose.runtime.Composable
import androidx.compose.material3.Text
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.ImageProperties

@Composable
fun ImageRenderer(
    properties: ImageProperties,
    context: A2UIContext
) {
    val url = context.resolveString(properties.url)
    // AsyncImage from Coil is standard, but keeping dependencies minimal for this implementation task.
    // For MVP without network permission config, just showing text placeholder.
    // In real app, add Coil dependency.
    Text("Image: $url")
}
