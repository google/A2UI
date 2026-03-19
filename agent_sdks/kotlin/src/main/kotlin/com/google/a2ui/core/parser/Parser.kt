package com.google.a2ui.core.parser

import com.google.a2ui.core.schema.A2uiConstants
import com.google.a2ui.core.schema.A2uiValidator
import java.util.logging.Logger
import kotlinx.serialization.json.JsonElement

private val logger = Logger.getLogger("com.google.a2ui.core.parser.Parser")

internal val A2UI_BLOCK_REGEX =
  Regex(
    "${A2uiConstants.A2UI_OPEN_TAG}(.*?)${A2uiConstants.A2UI_CLOSE_TAG}",
    RegexOption.DOT_MATCHES_ALL,
  )

/** Checks if the given text contains A2UI delimiter tags. */
fun hasA2uiParts(text: String): Boolean =
  text.contains(A2uiConstants.A2UI_OPEN_TAG) && text.contains(A2uiConstants.A2UI_CLOSE_TAG)

/** Represents a part of the LLM response. */
data class ResponsePart(val text: String, val a2uiJson: List<JsonElement>? = null)

/** Parses the response text into a list of ResponsePart objects. */
fun parseResponseToParts(text: String, validator: A2uiValidator? = null): List<ResponsePart> {
  val matches = A2UI_BLOCK_REGEX.findAll(text).toList()

  if (matches.isEmpty()) {
    throw IllegalArgumentException(
      "A2UI tags '${A2uiConstants.A2UI_OPEN_TAG}' and '${A2uiConstants.A2UI_CLOSE_TAG}' not found in response."
    )
  }

  val responseParts = mutableListOf<ResponsePart>()
  var lastEnd = 0

  for (match in matches) {
    val start = match.range.first
    val end = match.range.last + 1
    val textPart = text.substring(lastEnd, start).trim()

    val jsonString = match.groupValues[1]
    val jsonStringCleaned = sanitizeJsonString(jsonString)

    if (jsonStringCleaned.isEmpty()) {
      throw IllegalArgumentException("A2UI JSON part is empty.")
    }

    val elements = PayloadFixer.parseAndFix(jsonStringCleaned)
    elements.forEach { validator?.validate(it) }

    responseParts.add(ResponsePart(text = textPart, a2uiJson = elements))
    lastEnd = end
  }

  val trailingText = text.substring(lastEnd).trim()
  if (trailingText.isNotEmpty()) {
    responseParts.add(ResponsePart(text = trailingText, a2uiJson = null))
  }

  return responseParts
}

/** Sanitize LLM output by removing markdown code blocks if present. */
fun sanitizeJsonString(jsonString: String): String =
  jsonString.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
