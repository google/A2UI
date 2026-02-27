// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('CheckBox widget renders and handles changes', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([BasicCatalogItems.checkBox], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'CheckBox',
        properties: {
          'label': 'Check me',
          'value': {'path': '/myValue'},
        },
      ),
    ];
    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );
    surfaceController
        .contextFor(surfaceId)
        .dataModel
        .update(DataPath('/myValue'), true);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    expect(find.text('Check me'), findsOneWidget);
    final CheckboxListTile checkbox = tester.widget<CheckboxListTile>(
      find.byType(CheckboxListTile),
    );
    expect(checkbox.value, isTrue);

    await tester.tap(find.byType(CheckboxListTile));
    expect(
      surfaceController
          .contextFor(surfaceId)
          .dataModel
          .getValue<bool>(DataPath('/myValue')),
      isFalse,
    );
  });
}
