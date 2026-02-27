// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:genui/src/catalog/basic_functions.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

void main() {
  group('Catalog', () {
    test('has a catalogId', () {
      final catalog = Catalog([
        BasicCatalogItems.text,
      ], catalogId: 'test_catalog');
      expect(catalog.catalogId, 'test_catalog');
    });

    testWidgets('buildWidget finds and builds the correct widget', (
      WidgetTester tester,
    ) async {
      final catalog = Catalog([
        BasicCatalogItems.column,
        BasicCatalogItems.text,
      ]);
      final widgetData = {
        'children': [
          {'id': 'child1'},
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return catalog.buildWidget(
                  CatalogItemContext(
                    id: 'col1',
                    type: 'Column',
                    data: widgetData,
                    buildChild: (_, [_]) =>
                        const Text(''), // Mock child builder
                    dispatchEvent: (UiEvent event) {},
                    buildContext: context,
                    dataContext: DataContext(
                      InMemoryDataModel(),
                      DataPath.root,
                    ),
                    getComponent: (String componentId) => null,
                    getCatalogItem: (String type) => null,
                    surfaceId: 'surfaceId',
                    reportError: (e, s) {},
                  ),
                );
              },
            ),
          ),
        ),
      );
      expect(find.byType(Column), findsOneWidget);
      final Column column = tester.widget<Column>(find.byType(Column));
      expect(column.children.length, 1);
    });

    testWidgets('buildWidget throws StateError for unknown widget type', (
      WidgetTester tester,
    ) async {
      final catalog = const Catalog([]);
      final Map<String, Object> data = {
        'id': 'text1',
        'unknown_widget': {'text': 'hello'},
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                expect(
                  () => catalog.buildWidget(
                    CatalogItemContext(
                      id: 'text1',
                      type: 'unknown_widget',
                      data: data,
                      buildChild: (_, [_]) => const SizedBox(),
                      dispatchEvent: (UiEvent event) {},
                      buildContext: context,
                      dataContext: DataContext(
                        InMemoryDataModel(),
                        DataPath.root,
                      ),
                      getComponent: (String componentId) => null,
                      getCatalogItem: (String type) => null,
                      surfaceId: 'surfaceId',
                      reportError: (e, s) {},
                    ),
                  ),
                  throwsA(isA<CatalogItemNotFoundException>()),
                );
                return const SizedBox();
              },
            ),
          ),
        ),
      );
    });

    test('schema generation is correct', () {
      final catalog = Catalog([
        BasicCatalogItems.text,
        BasicCatalogItems.button,
      ]);
      final schema = catalog.definition as ObjectSchema;

      expect(schema.properties?.containsKey('components'), isTrue);
      expect(schema.properties?.containsKey('styles'), isTrue);

      final componentsSchema = schema.properties!['components'] as ObjectSchema;
      final Map<String, Schema> componentProperties =
          componentsSchema.properties!;

      expect(componentProperties.keys, contains('Text'));
      expect(componentProperties.keys, contains('Button'));
    });

    test('toCapabilitiesJson generates correct structure', () {
      final catalog = Catalog(
        [BasicCatalogItems.text, BasicCatalogItems.button],
        functions: [const RegexFunction()],
      );

      final JsonMap json = catalog.toCapabilitiesJson();

      expect(json.containsKey('catalogId'), isTrue);
      // Because we didn't specify one, it generates a fallback one
      expect(
        (json['catalogId'] as String).startsWith('inline_catalog_'),
        isTrue,
      );

      expect(json.containsKey('components'), isTrue);
      final components = json['components'] as JsonMap;
      expect(components.containsKey('Text'), isTrue);
      expect(components.containsKey('Button'), isTrue);

      // Check that components map directly to schemas, not inside 'properties'
      final textSchema = components['Text'] as JsonMap;
      expect(textSchema['type'], 'object');
      expect(textSchema.containsKey('properties'), isTrue);

      expect(json.containsKey('functions'), isTrue);
      final functions = json['functions'] as List<dynamic>;
      expect(functions.length, 1);
      final firstFunc = functions.first as JsonMap;
      expect(firstFunc['name'], 'regex');
      expect(firstFunc['description'], isNotEmpty);
      expect(firstFunc['returnType'], 'boolean');
      expect(firstFunc.containsKey('parameters'), isTrue);
    });
  });
}
