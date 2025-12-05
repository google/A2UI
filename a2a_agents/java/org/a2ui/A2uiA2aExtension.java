/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.a2ui;

import com.google.a2a.server.agent_execution.RequestContext;
import com.google.a2a.types.AgentExtension;
import com.google.a2a.types.DataPart;
import com.google.a2a.types.Part;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Utilities for the A2UI A2A Extension.
 */
public final class A2uiA2aExtension {
  private static final Logger logger = Logger.getLogger(A2uiA2aExtension.class.getName());

  public static final String A2UI_EXTENSION_URI = "https://a2ui.org/a2a-extension/v0.1";
  public static final String MIME_TYPE_KEY = "mimeType";
  public static final String A2UI_MIME_TYPE = "application/json+a2ui";

  private A2uiA2aExtension() {
    // Prevent instantiation
  }

  /**
   * Creates an A2A Part containing A2UI data.
   *
   * @param a2uiData The A2UI data map.
   * @return An A2A Part with a DataPart containing the A2UI data.
   */
  public static Part createA2uiPart(Map<String, Object> a2uiData) {
    Map<String, Object> metadata = new HashMap<>();
    metadata.put(MIME_TYPE_KEY, A2UI_MIME_TYPE);
    
    DataPart dataPart = new DataPart(a2uiData, metadata);
    return new Part(dataPart);
  }

  /**
   * Checks if an A2A Part contains A2UI data.
   *
   * @param part The A2A Part to check.
   * @return True if the part contains A2UI data, False otherwise.
   */
  public static boolean isA2uiPart(Part part) {
    if (part.getRoot() instanceof DataPart) {
      DataPart dataPart = (DataPart) part.getRoot();
      Map<String, Object> metadata = dataPart.getMetadata();
      return metadata != null && A2UI_MIME_TYPE.equals(metadata.get(MIME_TYPE_KEY));
    }
    return false;
  }

  /**
   * Extracts the DataPart containing A2UI data from an A2A Part, if present.
   *
   * @param part The A2A Part to extract A2UI data from.
   * @return The DataPart containing A2UI data if present, empty otherwise.
   */
  public static Optional<DataPart> getA2uiDatapart(Part part) {
    if (isA2uiPart(part)) {
      return Optional.of((DataPart) part.getRoot());
    }
    return Optional.empty();
  }

  /**
   * Creates the A2UI AgentExtension configuration.
   *
   * @param acceptsInlineCustomCatalog Whether the agent accepts inline custom catalogs.
   * @return The configured A2UI AgentExtension.
   */
  public static AgentExtension getA2uiAgentExtension(boolean acceptsInlineCustomCatalog) {
    Map<String, Object> params = new HashMap<>();
    if (acceptsInlineCustomCatalog) {
      params.put("acceptsInlineCustomCatalog", true);
    }

    return new AgentExtension(
        A2UI_EXTENSION_URI,
        "Provides agent driven UI using the A2UI JSON format.",
        params.isEmpty() ? null : params
    );
  }

  /**
   * Creates the A2UI AgentExtension configuration with default settings.
   *
   * @return The configured A2UI AgentExtension.
   */
  public static AgentExtension getA2uiAgentExtension() {
    return getA2uiAgentExtension(false);
  }

  /**
   * Activates the A2UI extension if requested.
   *
   * @param context The request context to check.
   * @return True if activated, False otherwise.
   */
  public static boolean tryActivateA2uiExtension(RequestContext context) {
    if (context.getRequestedExtensions().contains(A2UI_EXTENSION_URI)) {
      context.addActivatedExtension(A2UI_EXTENSION_URI);
      return true;
    }
    return false;
  }
}
