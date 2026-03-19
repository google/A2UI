package com.google.a2ui.core.schema

import java.io.File
import java.io.IOException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

/** Abstract base interface for providing A2UI schemas and catalogs. */
interface A2uiCatalogProvider {
  /**
   * Loads a catalog definition.
   *
   * @return The loaded catalog as a JsonObject.
   */
  fun load(): JsonObject
}

/** Loads catalog definition from the local filesystem. */
class FileSystemCatalogProvider(private val path: String) : A2uiCatalogProvider {
  override fun load(): JsonObject {
    try {
      val file = File(path)
      val content = file.readText(Charsets.UTF_8)
      return Json.parseToJsonElement(content) as JsonObject
    } catch (e: Exception) {
      throw IOException("Could not load schema from ${path}: ${e.message}", e)
    }
  }
}
