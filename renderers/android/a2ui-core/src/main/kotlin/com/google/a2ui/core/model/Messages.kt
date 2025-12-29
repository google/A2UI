package com.google.a2ui.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
sealed class ServerMessage {
    @Serializable
    @SerialName("surfaceUpdate")
    data class SurfaceUpdate(
        val surfaceId: String,
        val components: List<ComponentInstance>
    ) : ServerMessage()

    @Serializable
    @SerialName("dataModelUpdate")
    data class DataModelUpdate(
        val surfaceId: String,
        val path: String? = null,
        val contents: List<DataEntry>
    ) : ServerMessage()

    @Serializable
    @SerialName("beginRendering")
    data class BeginRendering(
        val surfaceId: String,
        val root: String,
        val catalogId: String? = null,
        val styles: JsonObject? = null
    ) : ServerMessage()

    @Serializable
    @SerialName("deleteSurface")
    data class DeleteSurface(
        val surfaceId: String
    ) : ServerMessage()
}

@Serializable
data class ComponentInstance(
    val id: String,
    val component: ComponentWrapper
)

@Serializable
data class ComponentWrapper(
    val Text: TextProperties? = null,
    val Button: ButtonProperties? = null,
    val Column: ContainerProperties? = null,
    val Row: ContainerProperties? = null,
    val Box: ContainerProperties? = null,
    val Image: ImageProperties? = null,
    val TextField: TextFieldProperties? = null,
    val Checkbox: CheckboxProperties? = null,
    val Slider: SliderProperties? = null,
    val Card: CardProperties? = null,
    val Tabs: TabsProperties? = null,
    val Modal: ModalProperties? = null,
    val DateTimeInput: DateTimeInputProperties? = null,
    val Video: VideoProperties? = null,
    val Audio: AudioProperties? = null,
    val Icon: IconProperties? = null,
    val Divider: DividerProperties? = null
)

@Serializable
data class DataEntry(
    val key: String,
    val valueString: String? = null,
    val valueNumber: Double? = null, // Using Double for generic number
    val valueBoolean: Boolean? = null,
    val valueMap: List<DataEntry>? = null
)
