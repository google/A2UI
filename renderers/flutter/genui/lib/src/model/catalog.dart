// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../primitives/logging.dart';
import '../primitives/simple_items.dart';
import 'catalog_item.dart';
import 'client_function.dart';
import 'data_model.dart';

/// Represents a collection of UI components that a generative AI model can use
/// to construct a user interface.
///
/// A [Catalog] serves three primary purposes:
///
/// 1. Holds a list of [CatalogItem]s, which define the available widgets.
/// 2. Holds a list of [ClientFunction]s, which define available functions.
/// 3. Provides a mechanism to build a Flutter widget from a JSON-like data
///    structure ([JsonMap]).
/// 4. Dynamically generates a [Schema] that describes the structure of all
///    supported widgets and functions, which can be provided to the AI model.
@immutable
interface class Catalog {
  /// Creates a new catalog with the given list of items.
  const Catalog(this.items, {this.functions = const [], this.catalogId});

  /// The list of [CatalogItem]s available in this catalog.
  final Iterable<CatalogItem> items;

  /// The list of [ClientFunction]s available in this catalog.
  final Iterable<ClientFunction> functions;

  /// A string that uniquely identifies this catalog.
  ///
  /// The recommended format for this string is reverse-domain name notation,
  /// e.g. 'com.example.my_catalog'.
  final String? catalogId;

  /// If an item or function with the same name already exists in the catalog,
  /// it will be replaced with the new one.
  Catalog copyWith({
    List<CatalogItem>? newItems,
    List<ClientFunction>? newFunctions,
    String? catalogId,
  }) {
    final Map<String, CatalogItem> itemsByName = {
      for (final item in items) item.name: item,
    };
    if (newItems != null) {
      itemsByName.addAll({for (final item in newItems) item.name: item});
    }

    final Map<String, ClientFunction> functionsByName = {
      for (final func in functions) func.name: func,
    };
    if (newFunctions != null) {
      functionsByName.addAll({
        for (final func in newFunctions) func.name: func,
      });
    }

    return Catalog(
      itemsByName.values,
      functions: functionsByName.values,
      catalogId: catalogId ?? this.catalogId,
    );
  }

  /// Returns a new [Catalog] instance containing the items from this catalog
  /// with the specified items removed.
  Catalog copyWithout({
    Iterable<CatalogItem>? itemsToRemove,
    Iterable<ClientFunction>? functionsToRemove,
    String? catalogId,
  }) {
    List<CatalogItem> updatedItems = items.toList();
    if (itemsToRemove != null) {
      final Set<String> namesToRemove = itemsToRemove
          .map<String>((item) => item.name)
          .toSet();
      updatedItems = items
          .where((item) => !namesToRemove.contains(item.name))
          .toList();
    }

    List<ClientFunction> updatedFunctions = functions.toList();
    if (functionsToRemove != null) {
      final Set<String> namesToRemove = functionsToRemove
          .map<String>((func) => func.name)
          .toSet();
      updatedFunctions = functions
          .where((func) => !namesToRemove.contains(func.name))
          .toList();
    }

    return Catalog(
      updatedItems,
      functions: updatedFunctions,
      catalogId: catalogId ?? this.catalogId,
    );
  }

  /// Builds a Flutter widget from a JSON-like data structure.
  Widget buildWidget(CatalogItemContext itemContext) {
    final String widgetType = itemContext.type;
    final CatalogItem? item = items.firstWhereOrNull(
      (item) => item.name == widgetType,
    );
    if (item == null) {
      throw CatalogItemNotFoundException(widgetType, catalogId: catalogId);
    }

    genUiLogger.info('Building widget ${item.name} with id ${itemContext.id}');
    return KeyedSubtree(
      key: ValueKey(itemContext.id),
      child: item.widgetBuilder(
        CatalogItemContext(
          data: itemContext.data,
          id: itemContext.id,
          type: widgetType,
          buildChild: (String childId, [DataContext? childDataContext]) =>
              itemContext.buildChild(
                childId,
                childDataContext ?? itemContext.dataContext,
              ),
          dispatchEvent: itemContext.dispatchEvent,
          buildContext: itemContext.buildContext,
          dataContext: itemContext.dataContext,
          getComponent: itemContext.getComponent,
          getCatalogItem: (String type) =>
              items.firstWhereOrNull((item) => item.name == type),
          surfaceId: itemContext.surfaceId,
          reportError: itemContext.reportError,
        ),
      ),
    );
  }

  /// Generates a JSON map suitable for inclusion in an inline catalog array
  /// within `A2UiClientCapabilities`.
  ///
  /// This differs from [definition] because `a2ui_client_capabilities.json`
  /// expects `components` to be a direct map of name to schema, and `functions`
  /// to be an array of objects.
  JsonMap toCapabilitiesJson() {
    return {
      if (catalogId != null) 'catalogId': catalogId,
      // Provide a fallback ID for inline if catalogId is null
      if (catalogId == null) 'catalogId': 'inline_catalog_$hashCode',
      'components': {
        for (final item in items) item.name: item.dataSchema.value,
      },
      'functions': [
        for (final func in functions)
          {
            'name': func.name,
            'description': func.description,
            'parameters': func.argumentSchema.value,
            'returnType': func.returnType.value,
          },
      ],
    };
  }

  /// A dynamically generated [Schema] that describes all widgets in the
  /// catalog.
  ///
  /// This schema is a "one-of" object, where the `widget` property can be one
  /// of the schemas from the [items] in the catalog. This is used to inform
  /// the generative AI model about the available UI components and their
  /// expected data structures.
  Schema get definition {
    final Map<String, Schema> componentProperties = {
      for (var item in items) item.name: item.dataSchema,
    };

    final Map<String, Schema> functionProperties = {
      for (var func in functions) func.name: func.argumentSchema,
    };

    return S.object(
      title: 'A2UI Catalog Description Schema',
      description:
          'A schema for a custom Catalog Description including A2UI '
          'components and styles.',
      properties: {
        'components': S.object(
          title: 'A2UI Components',
          description:
              'A schema that defines a catalog of A2UI components. '
              'Each key is a component name, and each value is the JSON '
              'schema for that component\'s properties.',
          properties: componentProperties,
        ),
        'styles': S.object(
          title: 'A2UI Styles',
          description:
              'A schema that defines a catalog of A2UI styles. Each key is a '
              'style name, and each value is the JSON schema for that style\'s '
              'properties.',
          properties: {},
        ),
        'functions': S.object(
          title: 'A2UI Functions',
          description:
              'A schema that defines a catalog of A2UI functions. Each key is '
              'a function name, and each value is the JSON schema for that '
              'function\'s arguments.',
          properties: functionProperties,
        ),
      },
      required: ['components', 'styles', 'functions'],
    );
  }
}

/// An exception thrown when a requested item is not found in the [Catalog].
class CatalogItemNotFoundException implements Exception {
  /// Creates a new [CatalogItemNotFoundException].
  const CatalogItemNotFoundException(this.widgetType, {this.catalogId});

  /// The type of the widget that was not found.
  final String widgetType;

  /// The ID of the catalog that was searched.
  final String? catalogId;

  @override
  String toString() {
    final buffer = StringBuffer();
    buffer.write(
      'CatalogItemNotFoundException: Item "$widgetType" '
      'was not found in catalog',
    );
    if (catalogId != null) {
      buffer.write(' "$catalogId"');
    }
    return buffer.toString();
  }
}
