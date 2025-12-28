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
    val key: String,
    val value: BoundValue
)

@Serializable
data class CheckboxProperties(
    val checked: BoundValue? = null,
    val label: BoundValue? = null,
    val onCheckedChange: Action? = null
)

@Serializable
data class SliderProperties(
    val value: BoundValue? = null,
    val min: Double? = null,
    val max: Double? = null,
    val onValueChange: Action? = null
)

@Serializable
data class SwitchProperties(
    val checked: BoundValue? = null,
    val label: BoundValue? = null,
    val onCheckedChange: Action? = null
)

@Serializable
data class CardProperties(
    val child: String? = null,
    // A2UI spec usually wraps a single child or children. Lit implementation uses 'child'.
    // We can support padding/elevation here if extending core spec, but adhering to base for now.
)

@Serializable
data class TabsProperties(
    val tabs: List<TabItem>? = null,
    val selectedIndex: BoundValue? = null,
    val onTabSelected: Action? = null
)

@Serializable
data class TabItem(
    val title: BoundValue,
    val child: String? = null // Reference to content component ID
)

@Serializable
data class ModalProperties(
    val title: BoundValue? = null,
    val content: String? = null, // ID of content component
    val isOpen: BoundValue? = null,
    val onDismiss: Action? = null,
    val actions: List<String>? = null // IDs of action buttons
)

@Serializable
data class DateTimeInputProperties(
    val label: BoundValue? = null,
    val value: BoundValue? = null, // ISO8601 string
    val onValueChange: Action? = null
)

// Simplified Media properties
@Serializable
data class VideoProperties(
    val url: BoundValue? = null,
    val autoPlay: Boolean? = false,
    val controls: Boolean? = true
)

@Serializable
data class AudioProperties(
    val url: BoundValue? = null,
    val autoPlay: Boolean? = false,
    val controls: Boolean? = true
)

