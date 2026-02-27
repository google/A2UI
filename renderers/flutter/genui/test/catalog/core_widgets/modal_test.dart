// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('Modal widget renders and handles taps', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.modal,
          BasicCatalogItems.button,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Modal',
        properties: {'trigger': 'trigger_text', 'content': 'modal_content'},
      ),
      const Component(
        id: 'trigger_text',
        type: 'Text',
        properties: {'text': 'Open Modal'},
      ),
      const Component(
        id: 'modal_content',
        type: 'Text',
        properties: {'text': 'This is a modal.'},
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

    expect(find.text('Open Modal'), findsOneWidget);
    expect(find.text('This is a modal.'), findsNothing);

    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    expect(find.text('This is a modal.'), findsOneWidget);
  });
}
