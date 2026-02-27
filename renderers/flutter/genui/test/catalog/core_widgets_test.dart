// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  group('Basic Widgets', () {
    final Catalog testCatalog = BasicCatalogItems.asCatalog();

    ChatMessage? message;
    SurfaceController? controller;

    Future<void> pumpWidgetWithDefinition(
      WidgetTester tester,
      String rootId,
      List<Component> components,
    ) async {
      message = null;
      controller?.dispose();
      controller = SurfaceController(catalogs: [testCatalog]);
      controller!.onSubmit.listen((event) => message = event);
      const surfaceId = 'testSurface';
      controller!.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );
      controller!.handleMessage(
        CreateSurface(surfaceId: surfaceId, catalogId: testCatalog.catalogId!),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Surface(surfaceContext: controller!.contextFor(surfaceId)),
          ),
        ),
      );
    }

    testWidgets('Button renders and handles taps', (WidgetTester tester) async {
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
        const Component(
          id: 'text',
          type: 'Text',
          properties: {'text': 'Click Me'},
        ),
      ];

      await pumpWidgetWithDefinition(tester, 'root', components);

      expect(find.text('Click Me'), findsOneWidget);

      expect(message, null);
      await tester.tap(find.byType(ElevatedButton));
      expect(message, isNotNull);
    });

    testWidgets('Text renders from data model', (WidgetTester tester) async {
      final components = [
        const Component(
          id: 'root',
          type: 'Text',
          properties: {
            'text': {'path': '/myText'},
          },
        ),
      ];

      await pumpWidgetWithDefinition(tester, 'root', components);
      controller!.store
          .getDataModel('testSurface')
          .update(DataPath('/myText'), 'Hello from data model');
      await tester.pumpAndSettle();

      expect(find.text('Hello from data model'), findsOneWidget);
    });

    testWidgets('Column renders children', (WidgetTester tester) async {
      final components = [
        const Component(
          id: 'root',
          type: 'Column',
          properties: {
            'children': ['text1', 'text2'],
          },
        ),
        const Component(
          id: 'text1',
          type: 'Text',
          properties: {'text': 'First'},
        ),
        const Component(
          id: 'text2',
          type: 'Text',
          properties: {'text': 'Second'},
        ),
      ];

      await pumpWidgetWithDefinition(tester, 'root', components);

      expect(find.text('First'), findsOneWidget);
      expect(find.text('Second'), findsOneWidget);
    });

    testWidgets('TextField renders and handles changes/submissions', (
      WidgetTester tester,
    ) async {
      final components = [
        const Component(
          id: 'root',
          type: 'TextField',
          properties: {
            'value': {'path': '/myValue'},
            'label': 'My Label',
            'onSubmittedAction': {
              'event': {'name': 'submit'},
            },
          },
        ),
      ];

      await pumpWidgetWithDefinition(tester, 'field', components);
      controller!.store
          .getDataModel('testSurface')
          .update(DataPath('/myValue'), 'initial');
      await tester.pumpAndSettle();

      final Finder textFieldFinder = find.byType(TextField);
      expect(find.widgetWithText(TextField, 'initial'), findsOneWidget);
      final TextField textField = tester.widget<TextField>(textFieldFinder);
      expect(textField.decoration?.labelText, 'My Label');

      // Test onChanged
      await tester.enterText(textFieldFinder, 'new value');
      expect(
        controller!.store
            .getDataModel('testSurface')
            .getValue<String>(DataPath('/myValue')),
        'new value',
      );

      // Test onSubmitted
      expect(message, null);
      await tester.testTextInput.receiveAction(TextInputAction.done);
      expect(message, isNotNull);
    });
  });
}
