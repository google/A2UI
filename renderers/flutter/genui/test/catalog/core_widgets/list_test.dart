// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('List widget renders children', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.list,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'List',
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

    expect(find.text('Second'), findsOneWidget);
  });

  testWidgets('List widget respects align property', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.list,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'List',
        properties: {
          'align': 'center',
          'children': ['text1'],
        },
      ),
      const Component(
        id: 'text1',
        type: 'Text',
        properties: {'text': 'Center'},
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

    expect(find.text('Center'), findsOneWidget);
    // Verify alignment logic by finding the Flex widget wrapping the child.
    final Flex flexWidget = tester.widget<Flex>(
      find.ancestor(of: find.text('Center'), matching: find.byType(Flex)).first,
    );
    expect(flexWidget.crossAxisAlignment, CrossAxisAlignment.center);
  });
}
