// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:genui/src/catalog/basic_catalog_widgets/choice_picker.dart';

void main() {
  // Test case based on jobApplication.1.sample
  testWidgets(
    'ChoicePicker mutuallyExclusive handles single String value in DataModel',
    (WidgetTester tester) async {
      final catalog = Catalog([choicePicker], catalogId: 'test');

      // Create a controller with a catalog that has ChoicePicker
      final controller = SurfaceController(catalogs: [catalog]);

      // Initial message to create surface and components
      final createSurface = const CreateSurface(
        surfaceId: 'test',
        catalogId: 'test',
      );

      final updateData = const UpdateDataModel(
        surfaceId: 'test',
        value: {
          'experience': '2-5', // Single string value, not a list
        },
        path: DataPath.root,
      );

      final updateComponents = const UpdateComponents(
        surfaceId: 'test',
        components: [
          Component(
            id: 'root',
            type: 'ChoicePicker',
            properties: {
              'label': 'Years of Experience',
              'variant': 'mutuallyExclusive',
              'options': [
                {'label': '0-1', 'value': '0-1'},
                {'label': '2-5', 'value': '2-5'},
                {'label': '5+', 'value': '5+'},
              ],
              'value': {'path': '/experience'},
            },
          ),
        ],
      );

      controller.handleMessage(createSurface);
      controller.handleMessage(updateData);
      controller.handleMessage(updateComponents);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Surface(surfaceContext: controller.contextFor('test')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify it rendered
      expect(find.text('Years of Experience'), findsOneWidget);
      expect(find.text('0-1'), findsOneWidget);
      expect(find.text('2-5'), findsOneWidget);

      // Verify selection (RadioListTile)
      // We check if the radio button corresponding to '2-5' is selected.
      // In Flutter RadioListTile, we can find the Radio widget.

      final Iterable<Radio<String>> radios = tester.widgetList<Radio<String>>(
        find.byType(Radio<String>),
      );
      expect(radios.length, 3);

      // The second radio should be selected
      final Radio<String> selectedRadio = radios.elementAt(1);
      expect(selectedRadio.value, '2-5');
      expect(
        // ignore: deprecated_member_use
        selectedRadio.groupValue,
        '2-5',
        reason: 'Group value should match the selected choice',
      );

      // Update data model to another single string
      controller.handleMessage(
        UpdateDataModel(
          surfaceId: 'test',
          path: DataPath('/experience'),
          value: '5+',
        ),
      );
      await tester.pumpAndSettle();

      final Iterable<Radio<String>> radiosAfter = tester
          .widgetList<Radio<String>>(find.byType(Radio<String>));
      // ignore: deprecated_member_use
      expect(radiosAfter.elementAt(2).groupValue, '5+');
    },
  );

  testWidgets('ChoicePicker multipleSelection handles List value', (
    WidgetTester tester,
  ) async {
    final catalog = Catalog([choicePicker], catalogId: 'std');

    final controller = SurfaceController(catalogs: [catalog]);

    final createSurface = const CreateSurface(
      surfaceId: 'test2',
      catalogId: 'std',
    );
    final updateData = const UpdateDataModel(
      surfaceId: 'test2',
      value: {
        'selections': ['A', 'B'],
      },
      path: DataPath.root,
    );
    final updateComponents = const UpdateComponents(
      surfaceId: 'test2',
      components: [
        Component(
          id: 'root',
          type: 'ChoicePicker',
          properties: {
            'label': 'Multi',
            'variant': 'multipleSelection',
            'options': [
              {'label': 'A', 'value': 'A'},
              {'label': 'B', 'value': 'B'},
              {'label': 'C', 'value': 'C'},
            ],
            'value': {'path': '/selections'},
          },
        ),
      ],
    );

    controller.handleMessage(createSurface);
    controller.handleMessage(updateData);
    controller.handleMessage(updateComponents);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(surfaceContext: controller.contextFor('test2')),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Multi'), findsOneWidget);

    // Verify Checkboxes
    final Iterable<Checkbox> checkboxes = tester.widgetList<Checkbox>(
      find.byType(Checkbox),
    );
    expect(checkboxes.length, 3);

    expect(checkboxes.elementAt(0).value, true); // A
    expect(checkboxes.elementAt(1).value, true); // B
    expect(checkboxes.elementAt(2).value, false); // C
  });

  testWidgets('ChoicePicker renders chips and supports filtering', (
    WidgetTester tester,
  ) async {
    final catalog = Catalog([choicePicker], catalogId: 'std');
    final controller = SurfaceController(catalogs: [catalog]);

    final createSurface = const CreateSurface(
      surfaceId: 'chipsTest',
      catalogId: 'std',
    );
    final updateData = const UpdateDataModel(
      surfaceId: 'chipsTest',
      value: {
        'tags': ['flutter'],
      },
      path: DataPath.root,
    );
    final updateComponents = const UpdateComponents(
      surfaceId: 'chipsTest',
      components: [
        Component(
          id: 'root',
          type: 'ChoicePicker',
          properties: {
            'label': 'Tags',
            'variant': 'multipleSelection',
            'displayStyle': 'chips',
            'filterable': true,
            'options': [
              {'label': 'Flutter', 'value': 'flutter'},
              {'label': 'Dart', 'value': 'dart'},
              {'label': 'GenUI', 'value': 'genui'},
            ],
            'value': {'path': '/tags'},
          },
        ),
      ],
    );

    controller.handleMessage(createSurface);
    controller.handleMessage(updateData);
    controller.handleMessage(updateComponents);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(surfaceContext: controller.contextFor('chipsTest')),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Tags'), findsOneWidget);
    // Find FilterChips
    expect(find.byType(FilterChip), findsNWidgets(3));
    expect(find.text('Flutter'), findsOneWidget);

    // Verify 'Flutter' is selected
    final FilterChip flutterChip = tester.widget<FilterChip>(
      find.widgetWithText(FilterChip, 'Flutter'),
    );
    expect(flutterChip.selected, true);

    // Verify filterable TextField exists
    expect(find.byType(TextField), findsOneWidget);

    // Filter by "Gen"
    await tester.enterText(find.byType(TextField), 'Gen');
    await tester.pumpAndSettle();

    // Flutter and Dart should be hidden (or at least filtered out visually)
    // The implementation might return SizedBox.shrink for filtered items.
    // Let's verify visible widgets.
    expect(find.text('GenUI'), findsOneWidget);
    expect(find.text('Flutter'), findsNothing);
    expect(find.text('Dart'), findsNothing);
  });

  testWidgets(
    'ChoicePicker handles null/missing data in valid path reference',
    (WidgetTester tester) async {
      final catalog = Catalog([choicePicker], catalogId: 'std');
      final controller = SurfaceController(catalogs: [catalog]);

      final createSurface = const CreateSurface(
        surfaceId: 'nullTest',
        catalogId: 'std',
      );
      // Note: We are NOT sending UpdateDataModel with the value initially.
      final updateComponents = const UpdateComponents(
        surfaceId: 'nullTest',
        components: [
          Component(
            id: 'root',
            type: 'ChoicePicker',
            properties: {
              'label': 'Null Check',
              'variant': 'multipleSelection',
              'options': [
                {'label': 'A', 'value': 'A'},
              ],
              // Points to a path that doesn't exist yet
              'value': {'path': '/missing_path'},
            },
          ),
        ],
      );

      controller.handleMessage(createSurface);
      controller.handleMessage(updateComponents);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Surface(surfaceContext: controller.contextFor('nullTest')),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Should render without error (title visible)
      expect(find.text('Null Check'), findsOneWidget);
      // Should have no selections
      final Iterable<Checkbox> checkboxes = tester.widgetList<Checkbox>(
        find.byType(Checkbox),
      );
      expect(checkboxes.length, 1);
      expect(checkboxes.first.value, false);
    },
  );

  testWidgets('ChoicePicker gracefully handles non-list data model values', (
    WidgetTester tester,
  ) async {
    final catalog = Catalog([choicePicker], catalogId: 'std');
    final controller = SurfaceController(catalogs: [catalog]);
    const surfaceId = 'testSurface';

    // Store a non-list string (should be treated as selected option if
    // it matches).
    controller.handleMessage(
      UpdateDataModel(
        surfaceId: surfaceId,
        path: DataPath('/choice'),
        value: 'option1',
      ),
    );

    final components = [
      const Component(
        id: 'root',
        type: 'ChoicePicker',
        properties: {
          'label': 'Test Choice',
          'value': {'path': '/choice'},
          'options': [
            {'label': 'Option 1', 'value': 'option1'},
            {'label': 'Option 2', 'value': 'option2'},
          ],
        },
      ),
    ];

    controller.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    controller.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'std'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(surfaceContext: controller.contextFor(surfaceId)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify option1 is checked even though data model had "option1" string
    // instead of ["option1"] list.
    final Checkbox checkbox1 = tester.widget<Checkbox>(
      find.descendant(
        of: find.widgetWithText(CheckboxListTile, 'Option 1'),
        matching: find.byType(Checkbox),
      ),
    );
    expect(checkbox1.value, true);

    // Also test number type
    controller.handleMessage(
      UpdateDataModel(
        surfaceId: surfaceId,
        path: DataPath('/choice'),
        value: 123,
      ),
    );
    await tester.pumpAndSettle();

    final Checkbox checkboxNumber = tester.widget<Checkbox>(
      find.descendant(
        of: find.widgetWithText(CheckboxListTile, 'Option 1'),
        matching: find.byType(Checkbox),
      ),
    );
    expect(checkboxNumber.value, false); // 123 does not match option1
  });
}
