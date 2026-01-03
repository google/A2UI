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
    val rawUrl = context.resolveString(properties.url)
    val url = rawUrl?.replace("localhost", "10.0.2.2")

    if (url != null) {
        coil.compose.AsyncImage(
            model = url,
            contentDescription = context.resolveString(properties.altText),
            modifier = androidx.compose.ui.Modifier,
            contentScale = androidx.compose.ui.layout.ContentScale.Crop
        )
    }
}
