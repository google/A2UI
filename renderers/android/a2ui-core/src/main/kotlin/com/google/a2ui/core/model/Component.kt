package com.google.a2ui.core.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class BoundValue(
    val literalString: String? = null,
    val literalNumber: Double? = null,
    val literalBoolean: Boolean? = null,
    val path: String? = null
)

@Serializable
data class TextProperties(
    val text: BoundValue? = null,
    val usageHint: String? = null
)

@Serializable
data class ButtonProperties(
    val label: BoundValue? = null,
    val child: String? = null,
    val action: Action? = null
)

@Serializable
data class ContainerProperties(
    val children: Children? = null,
    val alignment: String? = null // start, end, center, space-between
)

@Serializable
data class Children(
    val explicitList: List<String>? = null,
    val template: Template? = null
)

@Serializable
data class Template(
    val dataBinding: String,
    val componentId: String
)

@Serializable
data class ImageProperties(
    val url: BoundValue? = null,
    val altText: BoundValue? = null
)

@Serializable
data class TextFieldProperties(
    val label: BoundValue? = null,
    val value: BoundValue? = null,
    val onValueChange: Action? = null
)

@Serializable
data class Action(
    val name: String,
    val context: List<ContextEntry>? = null
)

@Serializable
data class ContextEntry(
    val key: String,
    val value: BoundValue
)
