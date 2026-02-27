// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('TextField with no weight in Row defaults to weight: 1 '
      'and expands', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    addTearDown(surfaceController.dispose);
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Row',
        properties: {
          'children': ['text_field'],
        },
      ),
      const Component(
        id: 'text_field',
        type: 'TextField',
        properties: {'label': 'Input'},
        // "weight" property is left unset.
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: basicCatalogId),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    expect(find.byType(TextField), findsOneWidget);

    final Flexible flexible = tester.widget(
      find.ancestor(
        of: find.byType(TextField),
        matching: find.byType(Flexible),
      ),
    );
    expect(flexible.flex, 1);

    final Finder textFieldFinder = find.byType(TextField);
    final Size size = tester.getSize(textFieldFinder);
    expect(size.width, 800.0);
  });

  testWidgets('TextField in Row (with weight) expands', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    addTearDown(surfaceController.dispose);
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Row',
        properties: {
          'children': ['text_field'],
        },
      ),
      const Component(
        id: 'text_field',
        type: 'TextField',
        properties: {'label': 'Input', 'weight': 1},
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: basicCatalogId),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    expect(find.byType(TextField), findsOneWidget);

    expect(
      find.ancestor(
        of: find.byType(TextField),
        matching: find.byType(Flexible),
      ),
      findsOneWidget,
    );

    // Default test screen width is 800.
    final Size size = tester.getSize(find.byType(TextField));
    expect(size.width, 800.0);
  });

  testWidgets('TextField validation checks work', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    addTearDown(surfaceController.dispose);
    const surfaceId = 'validationTest';
    // Initialize with invalid value
    surfaceController.handleMessage(
      UpdateDataModel(
        surfaceId: surfaceId,
        path: DataPath('/myValue'),
        value: 'initial',
      ),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'TextField',
        properties: {
          'label': 'Input',
          'value': {'path': 'inputValue'},
          'checks': [
            {
              'message': 'Must be at least 6 chars',
              'condition': {
                'call': 'length',
                'args': {
                  'value': {'path': 'inputValue'},
                  'min': 6,
                },
              },
            },
          ],
        },
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: basicCatalogId),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify error text is shown
    expect(find.text('Must be at least 6 chars'), findsOneWidget);

    // Update with valid value
    await tester.enterText(find.byType(TextField), 'valid value');
    await tester.pumpAndSettle();

    expect(find.text('Must be at least 6 chars'), findsNothing);
  });
  testWidgets('TextField validation using condition wrapper and call key', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    addTearDown(surfaceController.dispose);
    const surfaceId = 'validationWrapperTest';
    // Initialize with invalid value (empty string)
    surfaceController.handleMessage(
      UpdateDataModel(surfaceId: surfaceId, path: DataPath('/name'), value: ''),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'TextField',
        properties: {
          'label': 'Name',
          'value': {'path': '/name'},
          'checks': [
            {
              // Using "condition" wrapper and "call" instead of "func"
              // Args as list, as expected by function registry
              'condition': {
                'call': 'required',
                'args': {
                  'value': {'path': '/name'},
                },
              },
              'message': 'Name required',
            },
          ],
        },
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: basicCatalogId),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Empty value should trigger required
    expect(find.text('Name required'), findsOneWidget);

    // Update with valid value
    await tester.enterText(find.byType(TextField), 'Alice');
    await tester.pumpAndSettle();

    expect(find.text('Name required'), findsNothing);
  });

  testWidgets('TextField gracefully handles non-string data model values', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    addTearDown(surfaceController.dispose);
    const surfaceId = 'validationTypeTest';
    // Initialize with an integer value
    surfaceController.handleMessage(
      UpdateDataModel(
        surfaceId: surfaceId,
        path: DataPath('/name'),
        value: 123,
      ),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'TextField',
        properties: {
          'label': 'Name',
          'value': {'path': '/name'},
        },
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: basicCatalogId),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // The text field should convert the integer 123 to "123"
    expect(find.text('123'), findsOneWidget);
  });
}
