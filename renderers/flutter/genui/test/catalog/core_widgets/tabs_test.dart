// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('Tabs widget renders and handles taps', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.tabs,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Tabs',
        properties: {
          'component': 'Tabs',
          'tabs': [
            {'label': 'Tab 1', 'content': 'text1'},
            {'label': 'Tab 2', 'content': 'text2'},
          ],
        },
      ),
      const Component(
        id: 'text1',
        type: 'Text',
        properties: {'component': 'Text', 'text': 'This is the first tab.'},
      ),
      const Component(
        id: 'text2',
        type: 'Text',
        properties: {'component': 'Text', 'text': 'This is the second tab.'},
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

    expect(find.text('Tab 1'), findsOneWidget);
    expect(find.text('Tab 2'), findsOneWidget);
    expect(find.text('This is the first tab.'), findsOneWidget);
    expect(find.text('This is the second tab.'), findsNothing);

    await tester.tap(find.text('Tab 2'));
    await tester.pumpAndSettle();

    expect(find.text('This is the first tab.'), findsNothing);
    expect(find.text('This is the second tab.'), findsOneWidget);
  });

  testWidgets('Tabs activeTab binding works', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.tabs,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';

    // Initialize data model with tab 1 (index 1) active
    surfaceController.handleMessage(
      UpdateDataModel(
        surfaceId: surfaceId,
        path: DataPath('/'),
        value: {'currentTab': 1},
      ),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'Tabs',
        properties: {
          'component': 'Tabs',
          'activeTab': {'path': 'currentTab'},
          'tabs': [
            {'label': 'Tab 1', 'content': 'text1'},
            {'label': 'Tab 2', 'content': 'text2'},
          ],
        },
      ),
      const Component(
        id: 'text1',
        type: 'Text',
        properties: {'component': 'Text', 'text': 'Content 1'},
      ),
      const Component(
        id: 'text2',
        type: 'Text',
        properties: {'component': 'Text', 'text': 'Content 2'},
      ),
    ];

    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );

    // Initial build
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

    // Verify Tab 2 is active (index 1)
    expect(find.text('Content 2'), findsOneWidget);
    expect(find.text('Content 1'), findsNothing);

    // Update data model to switch to Tab 1 (index 0)
    surfaceController.handleMessage(
      UpdateDataModel(
        surfaceId: 'testSurface',
        path: DataPath('/currentTab'),
        value: 0,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Content 1'), findsOneWidget);
    expect(find.text('Content 2'), findsNothing);

    // Tap Tab 2
    await tester.tap(find.text('Tab 2'));
    await tester.pumpAndSettle();
    expect(find.text('Content 2'), findsOneWidget);

    // Verify data model updated
    final DataModel dataModel = surfaceController
        .contextFor(surfaceId)
        .dataModel;
    expect(dataModel.getValue<num>(DataPath('currentTab')), 1);
  });
}
