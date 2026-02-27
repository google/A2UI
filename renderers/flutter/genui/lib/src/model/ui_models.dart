// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../primitives/constants.dart';
import '../primitives/simple_items.dart';

/// A callback that is called when events are sent.
typedef SendEventsCallback =
    void Function(String surfaceId, List<UiEvent> events);

/// A callback that is called when an event is dispatched.
typedef DispatchEventCallback = void Function(UiEvent event);

/// A data object that represents a user interaction event in the UI.
///
/// Used to send information from the app to the AI about user
/// actions, such as tapping a button or entering text.
extension type UiEvent.fromMap(JsonMap _json) {
  /// The ID of the surface that this event originated from.
  String get surfaceId => _json[surfaceIdKey] as String;

  /// The ID of the widget that triggered the event.
  String get widgetId => _json['widgetId'] as String;

  /// The type of event that was triggered (e.g., 'onChanged', 'onTap').
  String get eventType => _json['eventType'] as String;

  /// The value associated with the event, if any.
  ///
  /// For example, the text in a `TextField`, or the value of a `Checkbox`.
  Object? get value => _json['value'];

  /// The timestamp of when the event occurred.
  DateTime get timestamp => DateTime.parse(_json['timestamp'] as String);

  /// Converts this event to a map, suitable for JSON serialization.
  JsonMap toMap() => _json;
}

/// A UI event that represents a user action.
///
/// Triggers a submission to the AI, such as tapping a button.
extension type UserActionEvent.fromMap(JsonMap _json) implements UiEvent {
  /// Creates a [UserActionEvent] from a set of properties.
  UserActionEvent({
    String? surfaceId,
    required String name,
    required String sourceComponentId,
    DateTime? timestamp,
    JsonMap? context,
  }) : _json = {
         surfaceIdKey: ?surfaceId,
         'name': name,
         'sourceComponentId': sourceComponentId,
         'timestamp': (timestamp ?? DateTime.now()).toIso8601String(),
         'context': context ?? {},
       };

  /// The name of the action.
  String get name => _json['name'] as String;

  /// The ID of the component that triggered the action.
  String get sourceComponentId => _json['sourceComponentId'] as String;

  /// Context associated with the action.
  JsonMap get context => _json['context'] as JsonMap;
}

final class _Json {
  static const String catalogId = 'catalogId';
  static const String components = 'components';
  static const String theme = 'theme';
}

/// A data object that represents the entire UI definition.
///
/// The root object that defines a complete UI to be rendered.
class SurfaceDefinition {
  /// The ID of the surface that this UI belongs to.
  final String surfaceId;

  /// The ID of the catalog to use for rendering this surface.
  final String catalogId;

  /// A map of all widget definitions in the UI, keyed by their ID.
  Map<String, Component> get components => UnmodifiableMapView(_components);
  final Map<String, Component> _components;

  /// The theme for this surface.
  final JsonMap? theme;

  /// Creates a [SurfaceDefinition].
  SurfaceDefinition({
    required this.surfaceId,
    this.catalogId = basicCatalogId,
    Map<String, Component> components = const {},
    this.theme,
  }) : _components = components;

  /// Creates a [SurfaceDefinition] from a JSON map.
  factory SurfaceDefinition.fromJson(JsonMap json) {
    return SurfaceDefinition(
      surfaceId: json[surfaceIdKey] as String,
      catalogId: json[_Json.catalogId] as String? ?? basicCatalogId,
      components:
          (json[_Json.components] as Map<String, Object?>?)?.map(
            (key, value) => MapEntry(key, Component.fromJson(value as JsonMap)),
          ) ??
          const {},
      theme: json[_Json.theme] as JsonMap?,
    );
  }

  /// Creates a copy of this [SurfaceDefinition] with the given fields replaced.
  SurfaceDefinition copyWith({
    String? catalogId,
    Map<String, Component>? components,
    JsonMap? theme,
  }) {
    return SurfaceDefinition(
      surfaceId: surfaceId,
      catalogId: catalogId ?? this.catalogId,
      components: components ?? _components,
      theme: theme ?? this.theme,
    );
  }

  /// Converts this object to a JSON map.
  JsonMap toJson() {
    return {
      surfaceIdKey: surfaceId,
      _Json.catalogId: catalogId,
      _Json.components: components.map(
        (key, value) => MapEntry(key, value.toJson()),
      ),
      _Json.theme: ?theme,
    };
  }

  /// Converts a UI definition into a blob of text.
  String asContextDescriptionText() {
    final String text = jsonEncode(this);
    return 'A user interface is shown with the following content:\n$text.';
  }

  /// Validates the UI definition against a schema.
  ///
  /// Throws [A2uiValidationException] if validation fails.
  void validate(Schema schema) {
    final String jsonOutput = schema.toJson();
    final schemaMap = jsonDecode(jsonOutput) as Map<String, dynamic>;

    List<Map<String, dynamic>> allowedSchemas = [];
    if (schemaMap.containsKey('oneOf')) {
      allowedSchemas = (schemaMap['oneOf'] as List)
          .cast<Map<String, dynamic>>();
    } else if (schemaMap.containsKey('properties') &&
        (schemaMap['properties'] as Map).containsKey('components')) {
      final componentsProp =
          (schemaMap['properties'] as Map)['components']
              as Map<String, dynamic>;
      if (componentsProp.containsKey('items')) {
        final items = componentsProp['items'] as Map<String, dynamic>;
        if (items.containsKey('oneOf')) {
          allowedSchemas = (items['oneOf'] as List)
              .cast<Map<String, dynamic>>();
        } else {
          allowedSchemas = [items];
        }
      } else if (componentsProp.containsKey('properties')) {
        allowedSchemas = (componentsProp['properties'] as Map).values
            .cast<Map<String, dynamic>>()
            .toList();
      }
    }

    if (allowedSchemas.isEmpty) {
      return;
    }

    for (final Component component in components.values) {
      var matched = false;
      List<String> errors = [];
      final JsonMap instanceJson = component.toJson();

      for (final s in allowedSchemas) {
        if (_schemaMatchesType(s, component.type)) {
          try {
            _validateInstance(instanceJson, s, '/components/${component.id}');
            matched = true;
            break;
          } catch (e) {
            errors.add(e.toString());
          }
        }
      }

      if (!matched) {
        if (errors.isNotEmpty) {
          throw A2uiValidationException(
            'Validation failed for component ${component.id} '
            '(${component.type}): ${errors.join("; ")}',
            surfaceId: surfaceId,
            path: '/components/${component.id}',
          );
        }
        throw A2uiValidationException(
          'Unknown component type: ${component.type}',
          surfaceId: surfaceId,
          path: '/components/${component.id}',
        );
      }
    }
  }

  bool _schemaMatchesType(Map<String, dynamic> schema, String type) {
    if (schema case {
      'properties': {'component': Map<String, dynamic> compProp},
    }) {
      return switch (compProp) {
        {'const': String constType} when constType == type => true,
        {'enum': List<dynamic> enums} when enums.contains(type) => true,
        _ => false,
      };
    }
    return false;
  }

  void _validateInstance(
    Object? instance,
    Map<String, dynamic> schema,
    String path,
  ) {
    if (instance == null) {
      return;
    }

    if (schema case {'const': Object? constVal} when instance != constVal) {
      throw A2uiValidationException(
        'Value mismatch. Expected $constVal, got $instance',
        surfaceId: surfaceId,
        path: path,
      );
    }

    if (schema case {
      'enum': List<dynamic> enums,
    } when !enums.contains(instance)) {
      throw A2uiValidationException(
        'Value not in enum: $instance',
        surfaceId: surfaceId,
        path: path,
      );
    }

    if (schema case {'required': List<dynamic> required} when instance is Map) {
      for (final String key in required.cast<String>()) {
        if (!instance.containsKey(key)) {
          throw A2uiValidationException(
            'Missing required property: $key',
            surfaceId: surfaceId,
            path: path,
          );
        }
      }
    }

    if (schema case {
      'properties': Map<String, dynamic> props,
    } when instance is Map) {
      for (final MapEntry<String, dynamic> entry in props.entries) {
        final String key = entry.key;
        final propSchema = entry.value as Map<String, dynamic>;
        if (instance.containsKey(key)) {
          _validateInstance(instance[key], propSchema, '$path/$key');
        }
      }
    }

    if (schema case {
      'items': Map<String, dynamic> itemsSchema,
    } when instance is List) {
      for (var i = 0; i < instance.length; i++) {
        _validateInstance(instance[i], itemsSchema, '$path/$i');
      }
    }

    if (schema case {'oneOf': List<dynamic> oneOfs}) {
      var oneMatched = false;
      for (final Map<String, dynamic> s
          in oneOfs.cast<Map<String, dynamic>>()) {
        try {
          _validateInstance(instance, s, path);
          oneMatched = true;
          break;
        } catch (_) {}
      }
      if (!oneMatched) {
        throw A2uiValidationException(
          'Value did not match any oneOf schema',
          surfaceId: surfaceId,
          path: path,
        );
      }
    }
  }
}

/// A component in the UI.
final class Component {
  /// Creates a [Component].
  const Component({
    required this.id,
    required this.type,
    required this.properties,
  });

  /// Creates a [Component] from a JSON map.
  factory Component.fromJson(JsonMap json) {
    if (json['component'] == null) {
      throw ArgumentError('Component.fromJson: component property is null');
    }
    final rawType = json['component'] as String;
    final id = json['id'] as String;

    final properties = Map<String, Object?>.from(json);
    properties.remove('id');
    properties.remove('component');

    return Component(id: id, type: rawType, properties: properties);
  }

  /// The unique ID of the component.
  final String id;

  /// The type of the component (e.g. 'Text', 'Button').
  final String type;

  /// The properties of the component.
  final JsonMap properties;

  /// Converts this object to a JSON map.
  JsonMap toJson() {
    return {'id': id, 'component': type, ...properties};
  }

  @override
  bool operator ==(Object other) =>
      other is Component &&
      id == other.id &&
      type == other.type &&
      const DeepCollectionEquality().equals(properties, other.properties);

  @override
  int get hashCode =>
      Object.hash(id, type, const DeepCollectionEquality().hash(properties));
}

/// Exception thrown when validation fails.
class A2uiValidationException implements Exception {
  /// Creates a [A2uiValidationException].
  A2uiValidationException(
    this.message, {
    this.surfaceId,
    this.path,
    this.json,
    this.cause,
  });

  /// The error message.
  final String message;

  /// The ID of the surface where the validation error occurred.
  final String? surfaceId;

  /// The path in the data/component model where the error occurred.
  final String? path;

  /// The JSON that caused the error.
  final Object? json;

  /// The underlying cause of the error.
  final Object? cause;

  @override
  String toString() {
    final buffer = StringBuffer('A2uiValidationException: $message');
    if (surfaceId != null) buffer.write(' (surface: $surfaceId)');
    if (path != null) buffer.write(' (path: $path)');
    if (cause != null) buffer.write('\nCause: $cause');
    if (json != null) buffer.write('\nJSON: $json');
    return buffer.toString();
  }
}

/// A sealed class representing an update to the UI managed by the system.
///
/// Subclasses: [SurfaceAdded], [ComponentsUpdated], and [SurfaceRemoved].
sealed class SurfaceUpdate {
  /// Creates a [SurfaceUpdate] for the given [surfaceId].
  const SurfaceUpdate(this.surfaceId);

  /// The ID of the surface that was updated.
  final String surfaceId;
}

/// Fired when a new surface is created.
final class SurfaceAdded extends SurfaceUpdate {
  /// Creates a [SurfaceAdded] event for the given [surfaceId] and
  /// [definition].
  const SurfaceAdded(super.surfaceId, this.definition);

  /// The definition of the new surface.
  final SurfaceDefinition definition;
}

/// Fired when an existing surface is modified.
final class ComponentsUpdated extends SurfaceUpdate {
  /// Creates a [ComponentsUpdated] event for the given [surfaceId] and
  /// [definition].
  const ComponentsUpdated(super.surfaceId, this.definition);

  /// The new definition of the surface.
  final SurfaceDefinition definition;
}

/// Fired when a surface is deleted.
final class SurfaceRemoved extends SurfaceUpdate {
  /// Creates a [SurfaceRemoved] event for the given [surfaceId].
  const SurfaceRemoved(super.surfaceId);
}
