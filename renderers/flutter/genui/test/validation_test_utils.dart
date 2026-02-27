// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/model/a2ui_message.dart';
import 'package:genui/src/model/a2ui_schemas.dart';
import 'package:genui/src/model/catalog.dart';
import 'package:genui/src/model/catalog_item.dart';
import 'package:genui/src/model/ui_models.dart';
import 'package:genui/src/primitives/simple_items.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

/// Validates the examples in the catalog items in the catalog.
void validateCatalogExamples(
  Catalog catalog, [
  List<Catalog> additionalCatalogs = const [],
]) {
  final mergedCatalog = Catalog([
    ...catalog.items,
    ...additionalCatalogs.expand((c) => c.items),
  ]);
  final Schema schema = A2uiSchemas.updateComponentsSchema(mergedCatalog);

  for (final CatalogItem item in catalog.items) {
    group('CatalogItem ${item.name}', () {
      for (var i = 0; i < item.exampleData.length; i++) {
        test('example $i is valid', () async {
          final String exampleJsonString = item.exampleData[i]();
          final List<Object?> exampleData;
          try {
            exampleData = jsonDecode(exampleJsonString) as List<Object?>;
          } catch (e) {
            fail(
              'Example $i for ${item.name} failed to parse as a JSON list: $e',
            );
          }

          final List<Component> components = exampleData
              .map((e) => Component.fromJson(e as JsonMap))
              .toList();

          expect(
            components.any((c) => c.id == 'root'),
            isTrue,
            reason: 'Example must have a component with id "root"',
          );

          final surfaceUpdate = UpdateComponents(
            surfaceId: 'test-surface',
            components: components,
          );

          final List<ValidationError> validationErrors = await schema.validate(
            surfaceUpdate.toJson(),
          );
          expect(validationErrors, isEmpty);
        });
      }
    });
  }
}
