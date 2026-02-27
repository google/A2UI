// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:json_schema_builder/json_schema_builder.dart';

import '../primitives/logging.dart';
import '../primitives/simple_items.dart';
import 'a2ui_schemas.dart';
import 'catalog.dart';
import 'data_model.dart';
import 'ui_models.dart';

/// A sealed class representing a message in the A2UI stream.
sealed class A2uiMessage {
  /// Creates an [A2uiMessage].
  const A2uiMessage();

  /// Creates an [A2uiMessage] from a JSON map.
  factory A2uiMessage.fromJson(JsonMap json) {
    try {
      final Object? version = json['version'];
      if (version != 'v0.9') {
        throw A2uiValidationException(
          'A2UI message must have version "v0.9"',
          json: json,
        );
      }
      if (json case {'createSurface': JsonMap data}) {
        try {
          return CreateSurface.fromJson(data);
        } catch (e) {
          throw A2uiValidationException(
            'Failed to parse CreateSurface message',
            json: json,
            cause: e,
          );
        }
      }
      if (json case {'updateComponents': JsonMap data}) {
        try {
          return UpdateComponents.fromJson(data);
        } catch (e) {
          throw A2uiValidationException(
            'Failed to parse UpdateComponents message',
            json: json,
            cause: e,
          );
        }
      }
      if (json case {'updateDataModel': JsonMap data}) {
        try {
          return UpdateDataModel.fromJson(data);
        } catch (e) {
          throw A2uiValidationException(
            'Failed to parse UpdateDataModel message',
            json: json,
            cause: e,
          );
        }
      }
      if (json case {'deleteSurface': JsonMap data}) {
        try {
          return DeleteSurface.fromJson(data);
        } catch (e) {
          throw A2uiValidationException(
            'Failed to parse DeleteSurface message',
            json: json,
            cause: e,
          );
        }
      }
    } on A2uiValidationException {
      rethrow;
    } catch (exception, stackTrace) {
      genUiLogger.severe(
        'Failed to parse A2UI message from JSON: $json',
        exception,
        stackTrace,
      );
      rethrow;
    }
    throw A2uiValidationException(
      'Unknown A2UI message type: ${json.keys}',
      json: json,
    );
  }

  /// Returns the JSON schema for an A2UI message.
  static Schema a2uiMessageSchema(Catalog catalog) {
    return S.combined(
      allOf: [
        S.object(
          title: 'A2UI Message Schema',
          description:
              'Describes a JSON payload for an A2UI (Agent to UI) message. '
              'A message MUST contain exactly ONE of the action properties.',
          properties: {
            'version': S.string(constValue: 'v0.9'),
            'createSurface': A2uiSchemas.createSurfaceSchema(),
            'updateComponents': A2uiSchemas.updateComponentsSchema(catalog),
            'updateDataModel': A2uiSchemas.updateDataModelSchema(),
            'deleteSurface': A2uiSchemas.deleteSurfaceSchema(),
          },
          required: ['version'],
        ),
      ],
      anyOf: [
        {
          'required': ['createSurface'],
        },
        {
          'required': ['updateComponents'],
        },
        {
          'required': ['updateDataModel'],
        },
        {
          'required': ['deleteSurface'],
        },
      ],
    );
  }
}

/// An A2UI message that signals the client to create and show a new surface.
final class CreateSurface extends A2uiMessage {
  /// Creates a [CreateSurface] message.
  const CreateSurface({
    required this.surfaceId,
    required this.catalogId,
    this.theme,
    this.sendDataModel = false,
  });

  /// Creates a [CreateSurface] message from a JSON map.
  factory CreateSurface.fromJson(JsonMap json) {
    return CreateSurface(
      surfaceId: json[surfaceIdKey] as String,
      catalogId: json['catalogId'] as String,
      theme: json['theme'] as JsonMap?,
      sendDataModel: json['sendDataModel'] as bool? ?? false,
    );
  }

  /// The ID of the surface that this message applies to.
  final String surfaceId;

  /// The ID of the catalog to use for rendering this surface.
  final String catalogId;

  /// The theme parameters for this surface.
  final JsonMap? theme;

  /// If true, the client sends the full data model in A2A metadata.
  final bool sendDataModel;

  /// Converts this message to a JSON map.
  Map<String, dynamic> toJson() => {
    'version': 'v0.9',
    surfaceIdKey: surfaceId,
    'catalogId': catalogId,
    'theme': ?theme,
    'sendDataModel': sendDataModel,
  };
}

/// An A2UI message that updates a surface with new components.
final class UpdateComponents extends A2uiMessage {
  /// Creates a [UpdateComponents] message.
  const UpdateComponents({required this.surfaceId, required this.components});

  /// Creates a [UpdateComponents] message from a JSON map.
  factory UpdateComponents.fromJson(JsonMap json) {
    return UpdateComponents(
      surfaceId: json[surfaceIdKey] as String,
      components: (json['components'] as List<Object?>)
          .map((e) => Component.fromJson(e as JsonMap))
          .toList(),
    );
  }

  /// The ID of the surface that this message applies to.
  final String surfaceId;

  /// The list of components to add or update.
  final List<Component> components;

  /// Converts this message to a JSON map.
  Map<String, dynamic> toJson() => {
    'version': 'v0.9',
    surfaceIdKey: surfaceId,
    'components': components.map((c) => c.toJson()).toList(),
  };
}

/// An A2UI message that updates the data model.
final class UpdateDataModel extends A2uiMessage {
  /// Creates a [UpdateDataModel] message.
  const UpdateDataModel({
    required this.surfaceId,
    this.path = DataPath.root,
    this.value,
  });

  /// Creates a [UpdateDataModel] message from a JSON map.
  factory UpdateDataModel.fromJson(JsonMap json) {
    return UpdateDataModel(
      surfaceId: json[surfaceIdKey] as String,
      path: DataPath(json['path'] as String? ?? '/'),
      value: json['value'],
    );
  }

  /// The ID of the surface that this message applies to.
  final String surfaceId;

  /// The path in the data model to update. Defaults to root '/'.
  final DataPath path;

  /// The new value to write to the data model.
  ///
  /// If null (and the key is present in the JSON), it implies deletion of the
  /// key at the path.
  final Object? value;

  /// Converts this message to a JSON map.
  Map<String, dynamic> toJson() => {
    'version': 'v0.9',
    surfaceIdKey: surfaceId,
    'path': path.toString(),
    'value': ?value,
  };
}

/// An A2UI message that deletes a surface.
final class DeleteSurface extends A2uiMessage {
  /// Creates a [DeleteSurface] message.
  const DeleteSurface({required this.surfaceId});

  /// Creates a [DeleteSurface] message from a JSON map.
  factory DeleteSurface.fromJson(JsonMap json) {
    return DeleteSurface(surfaceId: json[surfaceIdKey] as String);
  }

  /// The ID of the surface that this message applies to.
  final String surfaceId;

  /// Converts this message to a JSON map.
  Map<String, dynamic> toJson() => {'version': 'v0.9', surfaceIdKey: surfaceId};
}
