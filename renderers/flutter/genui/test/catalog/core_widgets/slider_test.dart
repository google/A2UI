// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  testWidgets('Slider widget renders and handles changes', (
    WidgetTester tester,
  ) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([BasicCatalogItems.slider], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Slider',
        properties: {
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
        .update(DataPath('/myValue'), 0.5);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    final Slider slider = tester.widget<Slider>(find.byType(Slider));
    expect(slider.value, 0.5);

    await tester.drag(find.byType(Slider), const Offset(100, 0));
    expect(
      surfaceController
          .contextFor(surfaceId)
          .dataModel
          .getValue<double>(DataPath('/myValue')),
      greaterThan(0.5),
    );
  });

  testWidgets('Slider widget renders label', (WidgetTester tester) async {
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([BasicCatalogItems.slider], catalogId: 'test_catalog'),
      ],
    );
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Slider',
        properties: {
          'value': {'path': '/myValue'},
          'label': 'Volume',
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
        .update(DataPath('/myValue'), 0.5);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    expect(find.text('Volume'), findsOneWidget);
  });
}
