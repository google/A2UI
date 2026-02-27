// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:logging/logging.dart';

void main() {
  late SurfaceController controller;
  final testCatalog = Catalog([
    BasicCatalogItems.button,
    BasicCatalogItems.text,
  ], catalogId: 'test_catalog');

  setUp(() {
    controller = SurfaceController(catalogs: [testCatalog]);
  });

  tearDown(() {
    controller.dispose();
  });

  testWidgets('SurfaceWidget builds a widget from a definition', (
    WidgetTester tester,
  ) async {
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Button',
        properties: {
          'child': 'text',
          'action': {
            'event': {'name': 'testAction'},
          },
        },
      ),
      const Component(id: 'text', type: 'Text', properties: {'text': 'Hello'}),
    ];
    controller.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    controller.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Surface(surfaceContext: controller.contextFor(surfaceId)),
      ),
    );

    expect(find.text('Hello'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });

  testWidgets('SurfaceWidget handles events', (WidgetTester tester) async {
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Button',
        properties: {
          'child': 'text',
          'action': {
            'event': {'name': 'testAction'},
          },
        },
      ),
      const Component(id: 'text', type: 'Text', properties: {'text': 'Hello'}),
    ];
    controller.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    controller.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Surface(surfaceContext: controller.contextFor(surfaceId)),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(ElevatedButton), findsOneWidget);
    await tester.tap(find.byType(ElevatedButton));
  });

  testWidgets(
    'SurfaceWidget renders container and logs error on catalog miss',
    (WidgetTester tester) async {
      const surfaceId = 'testSurface';
      final components = [
        const Component(
          id: 'root',
          type: 'Text',
          properties: {'text': 'Hello'},
        ),
      ];
      controller.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );
      // Request a catalogId that doesn't exist in the controller.
      controller.handleMessage(
        const CreateSurface(
          surfaceId: surfaceId,
          catalogId: 'non_existent_catalog',
        ),
      );

      final logs = <LogRecord>[];
      genUiLogger.onRecord.listen(logs.add);

      await tester.pumpWidget(
        MaterialApp(
          home: Surface(surfaceContext: controller.contextFor(surfaceId)),
        ),
      );

      // Should build an FallbackWidget instead of the widget tree.
      expect(find.byType(FallbackWidget), findsOneWidget);
      expect(
        find.textContaining('Catalog with id "non_existent_catalog" not found'),
        findsOneWidget,
      );

      // Should log a severe error.
      expect(
        logs.any(
          (r) =>
              r.level == Level.SEVERE &&
              r.message.contains(
                'Catalog with id "non_existent_catalog" not found',
              ),
        ),
        isTrue,
      );
    },
  );
}
