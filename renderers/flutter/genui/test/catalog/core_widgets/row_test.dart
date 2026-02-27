// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('Row widget renders children', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.row,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Row',
        properties: {
          'children': ['text1', 'text2'],
        },
      ),
      const Component(id: 'text1', type: 'Text', properties: {'text': 'First'}),
      const Component(
        id: 'text2',
        type: 'Text',
        properties: {'text': 'Second'},
      ),
    ];
    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
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

    expect(find.text('First'), findsOneWidget);
    expect(find.text('Second'), findsOneWidget);
  });

  testWidgets('Row widget applies weight property to children', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.row,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Row',
        properties: {
          'children': ['text1', 'text2', 'text3'],
        },
      ),
      const Component(
        id: 'text1',
        type: 'Text',
        properties: {'text': 'First', 'weight': 1},
      ),
      const Component(
        id: 'text2',
        type: 'Text',
        properties: {'text': 'Second', 'weight': 2},
      ),
      const Component(id: 'text3', type: 'Text', properties: {'text': 'Third'}),
    ];
    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
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

    expect(find.text('First'), findsOneWidget);
    expect(find.text('Second'), findsOneWidget);
    expect(find.text('Third'), findsOneWidget);

    final List<Flexible> flexibleWidgets = tester
        .widgetList<Flexible>(find.byType(Flexible))
        .toList();
    expect(flexibleWidgets.length, 2);

    // Check flex values
    expect(flexibleWidgets[0].flex, 1);
    expect(flexibleWidgets[1].flex, 2);

    // Check that the correct children are wrapped
    expect(
      find.ancestor(of: find.text('Third'), matching: find.byType(Flexible)),
      findsNothing,
    );
  });

  testWidgets('Row widget renders dynamic children from template', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.row,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';

    // Initial data with items
    surfaceController.handleMessage(
      const UpdateDataModel(
        surfaceId: surfaceId,
        value: {
          'items': ['Item 1', 'Item 2', 'Item 3'],
        },
      ),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'Row',
        properties: {
          'children': {'path': '/items', 'componentId': 'textItem'},
        },
      ),
      const Component(
        id: 'textItem',
        type: 'Text',
        properties: {
          'text': {'path': ''}, // Relative path (empty = self)
        },
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
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

    expect(find.text('Item 1'), findsOneWidget);
    expect(find.text('Item 2'), findsOneWidget);
    expect(find.text('Item 3'), findsOneWidget);
  });
}
