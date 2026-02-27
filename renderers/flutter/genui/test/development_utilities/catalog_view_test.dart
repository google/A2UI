// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  group('DebugCatalogView', () {
    // https://github.com/flutter/genui/issues/671
    testWidgets('Renders a custom Catalog', (WidgetTester tester) async {
      final expectedText = 'This Test Is Working!!';
      final testCatalog = Catalog([
        getCatalogItemForTesting(expectedText),
      ], catalogId: 'some-catalog-id-for-testing');

      await tester.pumpWidget(
        MaterialApp(home: DebugCatalogView(catalog: testCatalog)),
      );

      expect(find.text(expectedText), findsOneWidget);
    });
  });
}

/// Returns a simple fork of the core Text catalog item that renders the
/// incoming [successMessage].
CatalogItem getCatalogItemForTesting(String successMessage) {
  final catalogItemName = 'TextForTesting';
  return CatalogItem(
    name: catalogItemName,
    dataSchema: BasicCatalogItems.text.dataSchema,
    widgetBuilder: BasicCatalogItems.text.widgetBuilder,
    exampleData: [
      () => jsonEncode([
        {'id': 'root', 'component': catalogItemName, 'text': successMessage},
      ]),
    ],
  );
}
