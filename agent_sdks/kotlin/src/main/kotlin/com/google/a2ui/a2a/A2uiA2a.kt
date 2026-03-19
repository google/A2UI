package com.google.a2ui.a2a

import com.google.a2ui.core.schema.A2uiConstants
import io.a2a.spec.AgentExtension
import io.a2a.spec.DataPart
import io.a2a.spec.Part
import kotlinx.serialization.json.JsonElement

/** A2A protocol helpers for A2UI integration. */
object A2uiA2a {
  const val A2UI_EXTENSION_URI = "https://a2ui.org/a2a-extension/a2ui/v0.8"
  const val MIME_TYPE_KEY = "mimeType"
  const val A2UI_MIME_TYPE = "application/json+a2ui"

  /** Creates an A2A Part containing A2UI data. */
  fun createA2uiPart(a2uiData: JsonElement): Part<*> =
    DataPart(a2uiData, mapOf(MIME_TYPE_KEY to A2UI_MIME_TYPE))

  /** Checks if an A2A Part contains A2UI data. */
  fun isA2uiPart(part: Part<*>): Boolean =
    part is DataPart && part.metadata?.get(MIME_TYPE_KEY) == A2UI_MIME_TYPE

  /** Extracts the A2UI data from an A2A Part if present. */
  fun getA2uiData(part: Part<*>): JsonElement? =
    if (isA2uiPart(part)) (part as DataPart).data as? JsonElement else null

  /** Creates the A2UI AgentExtension configuration. */
  fun getA2uiAgentExtension(
    acceptsInlineCatalogs: Boolean = false,
    supportedCatalogIds: List<String> = emptyList(),
  ): AgentExtension {
    val params = mutableMapOf<String, Any>()
    if (acceptsInlineCatalogs) {
      params[A2uiConstants.INLINE_CATALOGS_KEY] = true
    }
    if (supportedCatalogIds.isNotEmpty()) {
      params[A2uiConstants.SUPPORTED_CATALOG_IDS_KEY] = supportedCatalogIds
    }

    return AgentExtension(
      A2UI_EXTENSION_URI,
      params,
      false, // isRequired
      "Provides agent driven UI using the A2UI JSON format.",
    )
  }

  /**
   * Activates the A2UI extension if requested in the context.
   *
   * @param requestedExtensions List of extension URIs requested by the client.
   * @param addActivatedExtension Callback to register an activated extension.
   * @return True if A2UI was activated, false otherwise.
   */
  fun tryActivateA2uiExtension(
    requestedExtensions: List<String>,
    addActivatedExtension: (String) -> Unit,
  ): Boolean {
    if (A2UI_EXTENSION_URI in requestedExtensions) {
      addActivatedExtension(A2UI_EXTENSION_URI)
      return true
    }
    return false
  }
}
