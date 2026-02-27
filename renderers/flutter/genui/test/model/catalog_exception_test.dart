// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
// import 'package:genui/src/model/catalog.dart'; // Exceptions should be exported by genui.dart, but if not we might need this.
// Assuming CatalogItemNotFoundException is exported or available.

void main() {
  group('Catalog Exception', () {
    testWidgets(
      'buildWidget throws CatalogItemNotFoundException when item is missing',
      (tester) async {
        final catalog = const Catalog([], catalogId: 'test_catalog');

        await tester.pumpWidget(Container());
        final BuildContext context = tester.element(find.byType(Container));

        final itemContext = CatalogItemContext(
          data: {},
          id: 'test_id',
          type: 'NonExistentWidget',
          buildChild: (id, [context]) => const SizedBox(),
          dispatchEvent: (event) {},
          buildContext: context,
          dataContext: DataContext(InMemoryDataModel(), DataPath.root),
          getComponent: (id) => null,
          getCatalogItem: (type) => null,
          surfaceId: 'test_surface',
          reportError: (e, s) {},
        );

        expect(
          () => catalog.buildWidget(itemContext),
          throwsA(
            isA<CatalogItemNotFoundException>()
                .having((e) => e.widgetType, 'widgetType', 'NonExistentWidget')
                .having((e) => e.catalogId, 'catalogId', 'test_catalog')
                .having(
                  (e) => e.toString(),
                  'toString',
                  contains(
                    'CatalogItemNotFoundException: Item "NonExistentWidget" '
                    'was not found in catalog "test_catalog"',
                  ),
                ),
          ),
        );
      },
    );

    testWidgets(
      'buildWidget throws CatalogItemNotFoundException without catalogId',
      (tester) async {
        final catalog = const Catalog([]);

        await tester.pumpWidget(Container());
        final BuildContext context = tester.element(find.byType(Container));

        final itemContext = CatalogItemContext(
          data: {},
          id: 'test_id',
          type: 'MissingWidget',
          buildChild: (id, [context]) => const SizedBox(),
          dispatchEvent: (event) {},
          buildContext: context,
          dataContext: DataContext(InMemoryDataModel(), DataPath.root),
          getComponent: (id) => null,
          getCatalogItem: (type) => null,
          surfaceId: 'test_surface',
          reportError: (e, s) {},
        );

        expect(
          () => catalog.buildWidget(itemContext),
          throwsA(
            isA<CatalogItemNotFoundException>()
                .having((e) => e.widgetType, 'widgetType', 'MissingWidget')
                .having((e) => e.catalogId, 'catalogId', isNull)
                .having(
                  (e) => e.toString(),
                  'toString',
                  contains(
                    'CatalogItemNotFoundException: Item "MissingWidget" '
                    'was not found in catalog',
                  ),
                )
                .having(
                  (e) => e.toString(),
                  'toString',
                  isNot(contains('"null"')),
                ),
          ),
        );
      },
    );
  });
}
